import { asText } from '@prismicio/client';
import { createClient } from '$lib/prismicio';

const STUDIO_DESCRIPTION =
	'Art Camp is a multi-disciplinary creative studio established in 2016 in New York City. ' +
	'We blend traditional and bespoke techniques with emerging technology to tell human stories.';

/**
 * llms.txt — a plain-text map of the site for language models, following the
 * convention at https://llmstxt.org. Everything here is also reachable as HTML;
 * this is the same content in a form that is cheap to read.
 *
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ url, fetch, cookies }) {
	const client = createClient({ fetch, cookies });
	const baseUrl = url.origin;

	const lines: string[] = ['# Art Camp', '', `> ${STUDIO_DESCRIPTION}`, ''];

	try {
		const [pages, projects] = await Promise.all([
			client.getAllByType('page', { pageSize: 100 }),
			client.getAllByType('projects', { pageSize: 100 })
		]);

		const sorted = [...projects].sort((a, b) => {
			const yearA = Number(a.data.year) || 0;
			const yearB = Number(b.data.year) || 0;
			if (yearA !== yearB) return yearB - yearA;
			return (a.data.title || '').localeCompare(b.data.title || '');
		});

		lines.push('## Projects', '');
		for (const project of sorted) {
			if (!project.uid) continue;
			const title = project.data.title || project.uid;
			const facts = [project.data.client, project.data.year].filter(Boolean).join(', ');
			const summary = summarize(asText(project.data.description).replace(/\s+/g, ' ').trim());
			const detail = [facts, summary].filter(Boolean).join(' — ');
			lines.push(`- [${title}](${baseUrl}/work/${project.uid})${detail ? `: ${detail}` : ''}`);
		}
		lines.push('');

		const contentPages = pages.filter((page) => page.uid);
		if (contentPages.length) {
			lines.push('## Pages', '');
			for (const page of contentPages) {
				const title = page.data.meta_title || page.uid;
				lines.push(`- [${title}](${baseUrl}/${page.uid})`);
			}
			lines.push('');
		}
	} catch (err) {
		console.error('llms.txt generation error:', err);
	}

	return new Response(lines.join('\n'), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'max-age=3600, s-maxage=3600'
		}
	});
}

function summarize(text: string, max = 200): string {
	if (!text) return '';
	if (text.length <= max) return text;
	const cut = text.slice(0, max);
	const lastSpace = cut.lastIndexOf(' ');
	return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}
