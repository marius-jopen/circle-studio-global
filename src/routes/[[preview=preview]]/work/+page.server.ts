import { asText } from '@prismicio/client';
import { createClient } from '$lib/prismicio';

const MONTHS = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Index of every project, rendered server-side. The homepage grid builds its
 * randomized layout after mount, so its project links never reach the HTML —
 * this page is what gives crawlers (and language models) a complete, linked
 * view of the work.
 */
export async function load({ fetch, cookies }) {
	const client = createClient({ fetch, cookies });

	const all = await client.getAllByType('projects', { pageSize: 100 });
	const deduped = Array.from(new Map(all.map((p) => [p.id, p])).values());

	const projects = deduped
		.filter((project) => project.uid)
		.map((project) => ({
			uid: project.uid as string,
			title: project.data.title || project.uid,
			client: project.data.client || '',
			year: project.data.year || '',
			month: project.data.month || '',
			tags: project.tags ?? [],
			description: asText(project.data.description).replace(/\s+/g, ' ').trim()
		}))
		.sort((a, b) => {
			const yearDiff = (Number(b.year) || 0) - (Number(a.year) || 0);
			if (yearDiff !== 0) return yearDiff;
			const monthDiff = MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month);
			if (monthDiff !== 0) return monthDiff;
			return (a.title || '').localeCompare(b.title || '');
		});

	return {
		projects,
		title: 'Work',
		meta_title: 'Work',
		meta_description: `Every project by Art Camp — ${projects.length} pieces of work for clients including ${topClients(projects)}.`
	};
}

function topClients(projects: { client: string }[]): string {
	const counts = new Map<string, number>();
	for (const { client } of projects) {
		if (client) counts.set(client, (counts.get(client) ?? 0) + 1);
	}
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 4)
		.map(([name]) => name)
		.join(', ');
}
