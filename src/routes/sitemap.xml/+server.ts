import { createClient } from '$lib/prismicio';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, fetch, cookies }) {
	const client = createClient({ fetch, cookies });
	const baseUrl = url.origin;

	const urls: { loc: string; lastmod?: string; changefreq?: string; priority?: number }[] = [];

	try {
		// Home page
		urls.push({
			loc: `${baseUrl}/`,
			changefreq: 'weekly',
			priority: 1
		});

		// Dynamic pages from Prismic (about, play, etc.)
		const pages = await client.getAllByType('page', { pageSize: 100 });
		for (const page of pages) {
			if (page.uid) {
				urls.push({
					loc: `${baseUrl}/${page.uid}`,
					lastmod: page.last_publication_date,
					changefreq: 'monthly',
					priority: 0.8
				});
			}
		}

		// Project pages
		const projects = await client.getAllByType('projects', { pageSize: 100 });
		for (const project of projects) {
			if (project.uid) {
				urls.push({
					loc: `${baseUrl}/work/${project.uid}`,
					lastmod: project.last_publication_date,
					changefreq: 'monthly',
					priority: 0.9
				});
			}
		}
	} catch (err) {
		console.error('Sitemap generation error:', err);
		// Still return minimal sitemap with home + play
	}

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(u) =>
			`  <url>
    <loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod.split('T')[0]}</lastmod>` : ''}${u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ''}${u.priority !== undefined ? `\n    <priority>${u.priority}</priority>` : ''}
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600, s-maxage=3600'
		}
	});
}

function escapeXml(unsafe: string): string {
	return unsafe.replace(/[<>&'"]/g, (c) => {
		switch (c) {
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
			case '&':
				return '&amp;';
			case "'":
				return '&apos;';
			case '"':
				return '&quot;';
			default:
				return c;
		}
	});
}
