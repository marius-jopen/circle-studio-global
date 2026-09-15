<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	const projects = $derived(data.projects);

	// ItemList JSON-LD: the index as data, so a crawler gets the full set of works
	// and their order without having to parse the markup.
	let listJsonLd = $derived.by(() => {
		const origin = page.url.origin;
		const ld = {
			'@context': 'https://schema.org',
			'@type': 'CollectionPage',
			name: 'Work — Art Camp',
			url: `${origin}/work`,
			description: data.meta_description,
			mainEntity: {
				'@type': 'ItemList',
				numberOfItems: projects.length,
				itemListElement: projects.map((project, index) => ({
					'@type': 'ListItem',
					position: index + 1,
					url: `${origin}/work/${project.uid}`,
					name: project.title
				}))
			}
		};
		const json = JSON.stringify(ld).replace(/</g, '\\u003c');
		return `<script type="application/ld+json">${json}<\/script>`;
	});
</script>

<svelte:head>
	{@html listJsonLd}
</svelte:head>

<div class="px-2">
	<!-- The page's visible identity is the list itself; this heading carries the same
	     name as the nav link and the title tag, for screen readers and crawlers. -->
	<h1 class="sr-only">Work</h1>

	<ul
		class="divide-y mb-3 divide-black/10 text-black md:hover:text-black/25 mt-[180px] md:mt-[210px] bg-neutral-100 rounded px-4 py-1 list-none"
	>
		{#each projects as project (project.uid)}
			<li>
				<a
					href="/work/{project.uid}"
					class="block py-2.5 transition-all duration-500 ease-out hover:text-black"
				>
					<div class="grid grid-cols-12 items-center gap-2 paragraph-1">
						<div class="col-span-6 md:col-span-4 text-left tracking-wide text-xs md:text-base">
							{project.client}
						</div>
						<div class="col-span-6 md:col-span-4 text-left text-xs md:text-base">
							{project.title}
						</div>
						<div class="col-span-3 text-left text-xs md:text-base whitespace-nowrap overflow-hidden text-ellipsis hidden md:block">
							{project.tags.join(', ')}
						</div>
						<div class="col-span-1 text-right hidden md:block text-xs md:text-base">
							{project.year}
						</div>
					</div>
				</a>
			</li>
		{/each}
	</ul>
</div>
