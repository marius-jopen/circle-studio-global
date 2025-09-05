import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import * as prismic from '@prismicio/client';

async function loadEnv() {
  try {
    await import('dotenv/config');
  } catch {}
  // Fallback: also load from migration/.env if root .env wasn't present
  if (!process.env.PRISMIC_WRITE_TOKEN) {
    try {
      const dotenv = await import('dotenv');
      const altPath = path.resolve('migration/.env');
      if (fs.existsSync(altPath)) {
        dotenv.config({ path: altPath });
      }
    } catch {}
  }
}

// Utility: read repository name from slicemachine.config.json at project root
function readRepositoryName() {
  const root = process.cwd();
  const cfgPath = path.join(root, 'slicemachine.config.json');
  const json = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  if (!json.repositoryName) throw new Error('repositoryName not found in slicemachine.config.json');
  return json.repositoryName;
}

// Utility: basic HTML entity decode for the input snippet
function decodeEntities(str) {
  return str
    .replaceAll(/&nbsp;/g, ' ')
    .replaceAll(/&amp;/g, '&')
    .replaceAll(/&lt;/g, '<')
    .replaceAll(/&gt;/g, '>')
    .replaceAll(/&#39;/g, "'")
    .replaceAll(/&quot;/g, '"');
}

function stripTags(html) {
  return html.replace(/<[^>]*>/g, '');
}

function normalizeInstagramHref(href) {
  if (!href) return href;
  let url = href.trim();
  // remove trailing hash from examples like .../#
  url = url.replace(/#$/g, '');
  // ensure https scheme if ig handle given as //
  if (url.startsWith('//')) url = 'https:' + url;
  return url;
}

function slugify(input) {
  return input
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase();
}

function cleanLabel(textBeforeAnchor) {
  let label = textBeforeAnchor || '';
  label = decodeEntities(stripTags(label)).trim();
  if (!label) return '';
  // If colon exists, take part before colon
  if (label.includes(':')) {
    label = label.split(':')[0];
  } else {
    // Heuristic: remove trailing proper-name like tokens if any (e.g., "Santiago Carrasquilla")
    label = label.replace(/\s*[A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)+\s*$/u, '');
  }
  // Trim stray separators
  label = label.replace(/[\s@/]+$/g, '').trim();
  return label;
}

function parseCreditsHTML(html) {
  const cleaned = decodeEntities(html)
    .replace(/\r\n|\r/g, '\n')
    .replace(/<p[^>]*>/g, '')
    .replace(/<\/p>/g, '')
    .trim();

  // Split by <br> into lines
  const lines = cleaned
    .split(/<br\s*\/?\s*>/i) // basic split on <br>
    .map((l) => l.trim())
    .filter(Boolean);

  const results = [];

  for (const line of lines) {
    const anchorRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
    let match;
    const people = [];
    let firstAnchorIndex = line.search(/<a\s/i);
    const prefix = firstAnchorIndex >= 0 ? line.slice(0, firstAnchorIndex) : line;
    const label = cleanLabel(prefix);

    while ((match = anchorRegex.exec(line)) !== null) {
      const href = normalizeInstagramHref(match[1]);
      const text = decodeEntities(stripTags(match[2])).trim();
      if (!href) continue;
      const name = text.replace(/^@/, '').trim();
      if (!name) continue;
      people.push({ name, url: href });
    }

    if (people.length === 0) {
      // Fallback: parse plain text names (no anchors)
      const plain = decodeEntities(stripTags(line)).trim();
      let namesText = '';
      if (plain.includes(':')) {
        namesText = plain.split(':').slice(1).join(':').trim();
      } else {
        // Take text after the inferred label
        const lbl = label || '';
        const after = plain.slice(lbl.length).trim();
        namesText = after;
      }

      if (namesText) {
        // Split on common separators
        const nameTokens = namesText
          .split(/\s*(?:,|&|\band\b)\s*/i)
          .map((s) => s.trim())
          .filter(Boolean);
        // Filter tokens that look like names (at least two words with capitals)
        const namePattern = /[A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)+/;
        for (const t of nameTokens) {
          const m = t.match(namePattern);
          const name = m ? m[0].trim() : '';
          if (name) people.push({ name });
        }
      }
    }

    if (people.length === 0) continue;
    results.push({ label: label || 'Credits', people });
  }

  // Normalize per-line people (dedupe by url/name within a line)
  return results.map((row) => {
    const seen = new Set();
    const unique = [];
    for (const p of row.people) {
      const key = (p.url || '') + '|' + p.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(p);
    }
    return { label: row.label, people: unique };
  });
}

async function fetchAllPeople(readClient) {
  const docs = await readClient.getAllByType('people', { pageSize: 100 });
  const byName = new Map();
  const byUrl = new Map();
  for (const d of docs) {
    const name = (d.data?.name || '').toString().trim().toLowerCase();
    const url = d.data?.link?.url ? normalizeInstagramHref(d.data.link.url) : '';
    if (name) byName.set(name, d);
    if (url) byUrl.set(url, d);
  }
  return { byName, byUrl, all: docs };
}

async function ensurePeople(writeClient, readMaps, candidates, lang) {
  const created = [];
  const resolved = new Map(); // key url|name -> doc
  const toCreate = [];
  for (const c of candidates) {
    const url = c.url ? normalizeInstagramHref(c.url) : '';
    const nameKey = c.name.toLowerCase();
    let doc = null;
    if (url && readMaps.byUrl.has(url)) {
      doc = readMaps.byUrl.get(url);
    } else if (readMaps.byName.has(nameKey)) {
      doc = readMaps.byName.get(nameKey);
    }
    if (doc) {
      resolved.set(url || nameKey, doc);
      continue;
    }

    // Queue for creation via migration
    const baseUID = slugify(c.name || (url ? new URL(url).pathname.split('/').filter(Boolean).pop() : 'person')) || 'person';
    toCreate.push({ uidBase: baseUID, nameKey, url, name: c.name });
  }

  if (toCreate.length > 0) {
    for (const item of toCreate) {
      let uid = item.uidBase;
      let attempt = 1;
      while (attempt <= 5) {
        try {
          const doc = await writeClient.createDocument({
            type: 'people',
            uid,
            lang,
            data: {
              name: item.name,
              link: item.url ? { link_type: 'Web', url: item.url } : { link_type: 'Any' }
            }
          });
          created.push(doc);
          readMaps.byName.set(item.nameKey, doc);
          if (item.url) readMaps.byUrl.set(item.url, doc);
          resolved.set(item.url || item.nameKey, doc);
          break;
        } catch (err) {
          const message = String(err?.message || err);
          if (/UID.*already.*used/i.test(message) || /conflict/i.test(message)) {
            attempt += 1;
            uid = `${item.uidBase}-${attempt}`;
            continue;
          }
          throw err;
        }
      }
    }
  }

  return { created, resolved };
}

function flattenPeople(rows) {
  const acc = new Map();
  for (const r of rows) {
    for (const p of r.people) {
      const key = (p.url ? normalizeInstagramHref(p.url) : '') + '|' + p.name.toLowerCase();
      if (!acc.has(key)) acc.set(key, p);
    }
  }
  return Array.from(acc.values());
}

function mergeCredits(existingCredits, additionsByLabel) {
  const labelKey = (s) => (s || '').toString().trim().toLowerCase();
  const out = Array.isArray(existingCredits) ? existingCredits.map((i) => ({ ...i })) : [];
  for (const add of additionsByLabel) {
    const key = labelKey(add.label);
    let target = out.find((i) => labelKey(i.label) === key);
    if (!target) {
      target = { label: add.label, person: [] };
      out.push(target);
    }
    const existingIds = new Set((target.person || []).map((pl) => pl?.id || pl?.documentId));
    for (const personLink of add.person) {
      const pid = personLink.id || personLink.documentId;
      if (!pid || existingIds.has(pid)) continue;
      existingIds.add(pid);
      target.person = Array.isArray(target.person) ? target.person.concat(personLink) : [personLink];
    }
  }
  return out;
}

// Apply already-parsed rows to a given project
async function applyRows({ projectUID, rows, dryRun, linkOnly, readClient, writeClient, writeToken, repositoryName, endpoint, lang }) {
  if (!rows || rows.length === 0) {
    return {
      mode: dryRun || !writeToken ? 'dry-run' : 'applied',
      error: 'No people found in provided input.'
    };
  }

  // Resolve project doc
  let projectDoc;
  try {
    projectDoc = await readClient.getByUID('projects', projectUID);
  } catch (err) {
    return { mode: 'error', error: `Project with UID "${projectUID}" not found.` };
  }

  const flatPeople = flattenPeople(rows);
  const readMaps = await fetchAllPeople(readClient);

  if (dryRun || linkOnly || !writeToken) {
    const unresolved = [];
    const resolved = [];
    for (const p of flatPeople) {
      const url = p.url ? normalizeInstagramHref(p.url) : '';
      const nameKey = p.name.toLowerCase();
      const doc = (url && readMaps.byUrl.get(url)) || readMaps.byName.get(nameKey);
      if (doc) resolved.push({ input: p, id: doc.id, uid: doc.uid });
      else unresolved.push(p);
    }

    const additions = rows.map((r) => ({
      label: r.label,
      person: r.people
        .map((p) => {
          const url = p.url ? normalizeInstagramHref(p.url) : '';
          const nameKey = p.name.toLowerCase();
          const doc = (url && readMaps.byUrl.get(url)) || readMaps.byName.get(nameKey);
          return doc ? { link_type: 'Document', id: doc.id, type: 'people' } : null;
        })
        .filter(Boolean)
    }));

    const merged = mergeCredits(projectDoc.data?.credits, additions);

    return {
      mode: 'dry-run',
      project: { uid: projectDoc.uid, id: projectDoc.id },
      parsed: rows,
      willCreate: unresolved,
      willLink: resolved.map((r) => ({ name: r.input.name, url: r.input.url, id: r.id, uid: r.uid })),
      mergedCreditsPreview: merged
    };
  }

  // Write mode
  const { resolved } = linkOnly
    ? { resolved: new Map() }
    : await ensurePeople(writeClient, readMaps, flatPeople, lang);

  const additions = rows.map((r) => ({
    label: r.label,
    person: r.people
      .map((p) => {
        const key = (p.url ? normalizeInstagramHref(p.url) : '') || p.name.toLowerCase();
        const doc =
          resolved.get(key) ||
          readMaps.byUrl.get(normalizeInstagramHref(p.url || '')) ||
          readMaps.byName.get(p.name.toLowerCase());
        return doc ? { link_type: 'Document', id: doc.id, type: 'people' } : null;
      })
      .filter(Boolean)
  }));

  const mergedCredits = mergeCredits(projectDoc.data?.credits, additions);

  const nextData = { ...projectDoc.data, credits: mergedCredits };
  const write =
    writeClient ||
    prismic.createWriteClient(repositoryName, {
      accessToken: writeToken,
      fetchOptions: { headers: { repository: repositoryName } }
    });
  const updated = await write.updateDocument(projectDoc.id, { lang, data: nextData });

  return {
    mode: 'applied',
    project: { uid: projectDoc.uid, id: projectDoc.id },
    createdPeople: Array.from(resolved.values())
      .filter((d) => !readMaps.all.find((x) => x.id === d.id))
      .map((d) => ({ id: d.id, uid: d.uid, name: d.data?.name, url: d.data?.link?.url })),
    creditsCount: updated.data?.credits?.length || nextData?.credits?.length || 0
  };
}

async function processFile({ projectUID, filePath, dryRun, readClient, writeClient, writeToken }) {
  const html = fs.readFileSync(path.resolve(filePath), 'utf8');
  const rows = parseCreditsHTML(html);
  return applyRows({ projectUID, rows, dryRun, readClient, writeClient, writeToken });
}

async function main() {
  await loadEnv();
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const idx = args.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
    if (idx === -1) return undefined;
    const entry = args[idx];
    if (entry.includes('=')) return entry.split('=').slice(1).join('=');
    return args[idx + 1];
  };

  const argProject = getArg('project') || getArg('slug');
  const filePathArg = getArg('file');
  const dirArg = getArg('dir') || getArg('directory');
  const genJson = (getArg('gen-json') || getArg('to-json') || 'false').toString().toLowerCase() === 'true';
  const outArg = getArg('out') || getArg('output');
  const dryRun = (getArg('dry-run') || 'true').toString().toLowerCase() !== 'false';

  if (!filePathArg && !dirArg) {
    console.error('Provide either --file <path.(html|json)> or --dir <directory>');
    process.exit(1);
  }

  const repositoryName = process.env.PRISMIC_REPOSITORY || process.env.PRISMIC_REPO || readRepositoryName();
  const endpoint = prismic.getRepositoryEndpoint(repositoryName);
  const accessToken = process.env.PRISMIC_ACCESS_TOKEN || process.env.PRISMIC_TOKEN;
  const writeToken = process.env.PRISMIC_WRITE_TOKEN || process.env.PRISMIC_ACCESS_TOKEN || process.env.PRISMIC_TOKEN;
  const lang = process.env.PRISMIC_LANG || 'en-us';
  const linkOnly = (getArg('link-only') || 'false').toString().toLowerCase() === 'true';

  const readClient = prismic.createClient(endpoint, { accessToken });
  const writeClient = writeToken ? prismic.createWriteClient(repositoryName, { accessToken: writeToken }) : undefined;

  const results = [];

  if (filePathArg) {
    const filePath = path.resolve(filePathArg);
    const ext = path.extname(filePath).toLowerCase();
    const inferred = path.basename(filePath, ext);
    const projectUID = argProject || inferred;
    if (genJson && (ext === '.html' || ext === '.htm')) {
      const html = fs.readFileSync(filePath, 'utf8');
      const rows = parseCreditsHTML(html);
      const json = { project: projectUID, rows };
      const outPath = outArg ? path.resolve(outArg) : path.join(path.dirname(filePath), `${inferred}.json`);
      fs.writeFileSync(outPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
      results.push({ file: filePath, out: outPath, project: projectUID, mode: 'generated-json', rows: rows.length });
    } else if (ext === '.json') {
      const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const project = json.project || projectUID;
      const rows = json.rows || [];
      const res = await applyRows({ projectUID: project, rows, dryRun, linkOnly, readClient, writeClient, writeToken, repositoryName, endpoint, lang });
      results.push({ file: filePath, project, ...res });
    } else {
      const res = await processFile({ projectUID, filePath, dryRun, readClient, writeClient, writeToken });
      results.push({ file: filePath, project: projectUID, ...res });
    }
  }

  if (dirArg) {
    const dirPath = path.resolve(dirArg);
    const files = fs.readdirSync(dirPath)
      .filter((f) => {
        const e = path.extname(f).toLowerCase();
        return e === '.html' || e === '.htm' || e === '.json';
      })
      .map((f) => path.join(dirPath, f));
    for (const filePath of files) {
      const ext = path.extname(filePath).toLowerCase();
      const inferred = path.basename(filePath, ext);
      const projectUID = inferred; // filename determines slug
      try {
        if (genJson && (ext === '.html' || ext === '.htm')) {
          const html = fs.readFileSync(filePath, 'utf8');
          const rows = parseCreditsHTML(html);
          const json = { project: projectUID, rows };
          const outPath = path.join(path.dirname(filePath), `${inferred}.json`);
          fs.writeFileSync(outPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
          results.push({ file: filePath, out: outPath, project: projectUID, mode: 'generated-json', rows: rows.length });
          continue;
        }

        if (ext === '.json') {
          const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const project = json.project || projectUID;
          const rows = json.rows || [];
          const res = await applyRows({ projectUID: project, rows, dryRun, linkOnly, readClient, writeClient, writeToken, repositoryName, endpoint, lang });
          results.push({ file: filePath, project, ...res });
          continue;
        }

        const res = await processFile({ projectUID, filePath, dryRun, readClient, writeClient, writeToken });
        results.push({ file: filePath, project: projectUID, ...res });
      } catch (err) {
        results.push({ file: filePath, project: projectUID, mode: 'error', error: String(err?.message || err) });
      }
    }
  }

  console.log(JSON.stringify({ results }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


