/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const baseUrl = url.origin;

	// One wildcard block on purpose: naming a bot in its own section would make that
	// section replace this one for that bot, and the disallow rules below would stop
	// applying to it. AI crawlers are welcome — they are covered by the same Allow.
	const robotsTxt = `User-agent: *
Allow: /

# Tools and endpoints with nothing to index
Disallow: /admin
Disallow: /login
Disallow: /api/
Disallow: /preview
Disallow: /slice-simulator
Disallow: /test

Sitemap: ${baseUrl}/sitemap.xml
`;

	return new Response(robotsTxt, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'max-age=86400'
		}
	});
}
