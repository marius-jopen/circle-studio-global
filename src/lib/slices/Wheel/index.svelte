<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import FanWheel from '$lib/components/FanWheel.svelte';
	import { createClient } from '$lib/prismicio';
	import { asLink } from '@prismicio/client';
	import { onMount, onDestroy } from 'svelte';

	type Props = SliceComponentProps<Content.WheelSlice>;

	const { slice }: Props = $props();

	let items = $state<string[]>([]);
	let urls = $state<string[]>([]);
	let isMobile = $state(false);
	let mounted = $state(false);
	const rotationSpeed = 200;

	function checkMobile() {
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth < 768;
		}
	}

	onMount(async () => {
		mounted = true;
		checkMobile();

		const primary: any = (slice as any).primary;
		if (primary?.take_collaborators_automatically) {
			const client = createClient();
			const docs = await client.getAllByType('people', {
				orderings: [{ field: 'my.people.title', direction: 'asc' }],
				pageSize: 200
			});
			items = docs.map((d) => (d.data.title as string) || d.uid);
			urls = docs.map((d) => asLink(d.data.link) || '#');
		} else {
			const manualLinks: any[] = primary?.items || [];
			const client = createClient();
			
			// Process each manual link
			const processedItems = await Promise.all(
				manualLinks.map(async (link) => {
					// If there's custom text, use it
					if (link?.text) {
						return {
							text: link.text,
							url: asLink(link) || '#'
						};
					}
					
					// If it's a content relationship (person), fetch the person's name
					if (link?.link_type === 'Document' && link?.uid) {
						try {
							const doc = await client.getByUID('people', link.uid);
							return {
								text: doc.data.title || doc.uid,
								url: asLink(doc.data.link) || '#'
							};
						} catch (error) {
							console.warn(`Could not fetch person with UID: ${link.uid}`, error);
							return {
								text: link.uid || 'Unknown',
								url: asLink(link) || '#'
							};
						}
					}
					
					// Fallback for other link types
					return {
						text: link?.text || asLink(link) || 'Unknown',
						url: asLink(link) || '#'
					};
				})
			);
			
			items = processedItems.map(item => item.text);
			urls = processedItems.map(item => item.url);
		}

		// Listen for resize events to handle mobile/desktop switching
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', checkMobile);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', checkMobile);
		}
	});
</script>

<section class="mb-8 mt-8" data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	<div class="flex justify-center items-center w-full md:pt-24 md:pb-24">
		{#if mounted && isMobile}
			<!-- Mobile: Two-column list -->
			<div class="w-full content-container px-4 opacity-40">
				<div class="grid grid-cols-2 gap-3 md:gap-2">
					{#each items as item, index}
						<div class="">
							{#if urls[index] && urls[index] !== '#'}
								<a 
									href={urls[index]} 
									class="text-xl font-medium text-black block"
									target="_blank"
									rel="noopener noreferrer"
								>
									{item}
								</a>
							{:else}
								<span class="text-xl font-medium text-black block">
									{item}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{:else if mounted}
			<!-- Desktop: FanWheel -->
			<FanWheel {items} {urls} radius={200} rotationSpeed={rotationSpeed} fontSize={26} />
		{:else}
			<!-- SSR Fallback: Simple list -->
			<div class="w-full max-w-4xl px-4">
				<div class="grid grid-cols-2 gap-4 md:gap-6">
					{#each items as item, index}
						<div class="text-center">
							{#if urls[index] && urls[index] !== '#'}
								<a 
									href={urls[index]} 
									class="text-lg font-medium text-black hover:text-gray-600 transition-colors duration-200 block py-2"
									target="_blank"
									rel="noopener noreferrer"
								>
									{item}
								</a>
							{:else}
								<span class="text-lg font-medium text-black block py-2">
									{item}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</section>

<style>
</style>
