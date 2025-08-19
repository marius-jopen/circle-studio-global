## Credits import tool

Script to parse HTML credits, create missing People, and attach them to a Project's `credits` group in Prismic.

### Requirements
- Node 18+
- Repo dependencies installed (`npm i`)

### Environment setup (.env)
Create a `.env` file at the project root (or `migration/.env`):

```
PRISMIC_WRITE_TOKEN=your_write_token
# Optional if your repo is private for reads
PRISMIC_ACCESS_TOKEN=your_access_token
```

The script auto-loads `.env`. If the root `.env` is missing, it will also try `migration/.env`. No need to prefix commands with tokens.

### Usage

1) Save your credits HTML block to a file, e.g. `./credits.html`.

2) Generate JSON from HTML (edit before applying):

```bash
node migration/credits-import.mjs --file ./migration/test-1.html --gen-json=true
```

This creates `./test-1.json` with a structure like:

```json
{
  "project": "test-1",
  "rows": [
    { "label": "Creative Director", "people": [{ "name": "Santiago Carrasquilla", "url": "https://..." }] }
  ]
}
```

Tip: review and correct the JSON before applying.
- Fix split labels/names if needed, e.g. change
  - `"Technical Directors Julen Keoni, Nick Apple and"` → label: `"Technical Directors"`; people: `"Julen Keoni"`, `"Nick Apple"`, `"Kyle Daum"`.
  - `"Color by J"` + person `"orge Valandia"` → label: `"Color"`; person: `"Jorge Velandia"` with URL.

2.5) Optional: Paste the generated JSON into this AI chat for a quick review/fix before applying.

3) Dry run one file (project inferred from filename):

```bash
node migration/credits-import.mjs --file ./migration/test-1.json
```

4) Apply one file (HTML or the edited JSON):

```bash
node migration/credits-import.mjs --project test-1 --file ./migration/test-1.html --dry-run=false

# Or from JSON after manual edits
node migration/credits-import.mjs --file ./migration/test-1.json --dry-run=false
```

5) Batch process a directory (project inferred from each filename):

```bash
# All *.html or *.json in ./migration will be processed; filename (without extension) is the project slug
node migration/credits-import.mjs --dir ./migration

# Apply changes for all files
node migration/credits-import.mjs --dir ./migration --dry-run=false
```

### Behavior
- Parses each `<br>`-separated line for a label (text before the first link) and anchors as people
- Person name is taken from the anchor text (leading `@` removed)
- Deduplicates by link URL or name
- Reuses existing People by URL or name; otherwise creates new People with `name` and `link`
- Merges into the Project's `credits` group by matching `label` (case-insensitive), appending unique people

### Notes
- Repository name is read from `slicemachine.config.json` unless `PRISMIC_REPOSITORY`/`PRISMIC_REPO` is provided
- For Instagram links ending with `#`, the trailing hash is removed
 - `.env` is auto-loaded if present

### Draft vs Published projects
- The importer reads projects from the public Content API, which returns published documents only.
- If a project is saved but not published, publish it once to run the import, then unpublish if desired.
- Advanced (not implemented here): updating by document ID or using a preview ref could avoid publishing. If you want this, let’s add `--project-id` / `--ref` support.


