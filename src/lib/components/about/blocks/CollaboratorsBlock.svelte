<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { asLink } from '@prismicio/client';
	import FanWheel from '$lib/components/FanWheel.svelte';
	import { createClient } from '$lib/prismicio';
	import type { CollaboratorsBlock } from '$lib/types/aboutBlock';

	export let block: CollaboratorsBlock;

	let items: string[] = [];
	let urls: string[] = [];
	let isMobile = false;
	let windowWidth = 375;
	let mounted = false;
	let isMounted = true;
	let hovering = false;

	const rotationSpeed = 200;

	$: wheelRadius = isMobile ? Math.min(Math.floor(windowWidth * 0.18), 85) : 140;
	$: wheelFontSize = isMobile ? Math.min(Math.floor(windowWidth * 0.03), 14) : 18;

	function checkMobile() {
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth < 768;
			windowWidth = window.innerWidth;
		}
	}

	async function processLinks(links: any[]): Promise<{ items: string[]; urls: string[] }> {
		if (!links?.length) return { items: [], urls: [] };
		const client = createClient();
		const processed = await Promise.all(
			links.map(async (link) => {
				if (!isMounted) return { text: '', url: '#' };
				if (link?.text) {
					return { text: link.text, url: asLink(link) || '#' };
				}
				if (link?.link_type === 'Document' && link?.uid) {
					try {
						const type = link?.type || 'people';
						const doc = await client.getByUID(type, link.uid);
						if (!isMounted) return { text: '', url: '#' };
						const data = doc.data as { title?: string; link?: any };
						return {
							text: data?.title || doc.uid,
							url: asLink(data?.link) || asLink(link) || '#'
						};
					} catch {
						return { text: link.uid || 'Unknown', url: asLink(link) || '#' };
					}
				}
				return {
					text: link?.text || asLink(link) || 'Unknown',
					url: asLink(link) || '#'
				};
			})
		);
		return {
			items: processed.map((p) => p.text).filter(Boolean),
			urls: processed.map((p) => p.url)
		};
	}

	async function fetchData(retries = 3): Promise<void> {
		if (!isMounted) return;
		try {
			if (block.takeAutomatically) {
				const client = createClient();
				const docs = await client.getAllByType('people', {
					orderings: [{ field: 'my.people.title', direction: 'asc' }]
				});
				if (!isMounted) return;
				items = docs.map((d) => (d.data as { title?: string }).title || d.uid || '').filter(Boolean);
				urls = docs.map((d) => asLink((d.data as { link?: any }).link) || '#');
			} else {
				const result = await processLinks(block.items as any[]);
				if (!isMounted) return;
				items = result.items;
				urls = result.urls;
			}
		} catch {
			if (retries > 0 && isMounted) {
				await new Promise((r) => setTimeout(r, 1000));
				if (isMounted) return fetchData(retries - 1);
			}
		}
	}

	onMount(async () => {
		isMounted = true;
		mounted = true;
		checkMobile();
		await fetchData();
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', checkMobile);
		}
	});

	onDestroy(() => {
		isMounted = false;
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', checkMobile);
		}
	});
</script>

<div class="min-w-0 flex flex-col bg-white rounded-lg overflow-hidden w-full h-full">
	<div class="flex-1 w-full relative flex justify-center min-h-[200px] md:min-h-[280px]">
		{#if mounted && items.length > 0}
			<FanWheel
				{items}
				{urls}
				radius={wheelRadius}
				{rotationSpeed}
				fontSize={wheelFontSize}
				fit={isMobile ? 'safe' : 'tight'}
				staggerMs={40}
				revealMs={150}
				bind:isHovering={hovering}
			/>
		{/if}
	</div>
	{#if block.title}
		<div
			class="text-sm md:text-xl font-medium text-primary pl-[15px] pr-4 md:pr-6 pb-2.5 pt-0 text-left"
		>
			{block.title}
		</div>
	{/if}
</div>
