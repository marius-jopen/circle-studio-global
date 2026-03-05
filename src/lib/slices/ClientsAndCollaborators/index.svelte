<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import FanWheel from '$lib/components/FanWheel.svelte';
	import { createClient } from '$lib/prismicio';
	import { asLink } from '@prismicio/client';
	import { onMount, onDestroy } from 'svelte';

	type Props = SliceComponentProps<Content.ClientsAndCollaboratorsSlice>;

	const { slice }: Props = $props();

	const switchOrder = $derived((slice.primary as { switch?: boolean }).switch ?? false);

	let clientsItems = $state<string[]>([]);
	let clientsUrls = $state<string[]>([]);
	let collaboratorsItems = $state<string[]>([]);
	let collaboratorsUrls = $state<string[]>([]);
	let isMobile = $state(false);
	let windowWidth = $state(375);
	let mounted = $state(false);
	let isMounted = $state(true);
	let clientsHovering = $state(false);
	let collaboratorsHovering = $state(false);

	const rotationSpeed = 200;
	const wheelRadius = $derived(isMobile ? Math.min(Math.floor(windowWidth * 0.18), 85) : 140);
	const wheelFontSize = $derived(isMobile ? Math.min(Math.floor(windowWidth * 0.03), 14) : 18);

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
					} catch (e) {
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
		clientsItems = [];
		clientsUrls = [];
		collaboratorsItems = [];
		collaboratorsUrls = [];

		const primary = slice.primary as any;

		try {
			const [clientsResult, collaboratorsResult] = await Promise.all([
				processLinks(primary?.clients || []),
				primary?.take_collaborators_automatically
					? (async () => {
							const client = createClient();
							const docs = await client.getAllByType('people', {
								orderings: [{ field: 'my.people.title', direction: 'asc' }],
								pageSize: 100
							});
							if (!isMounted) return { items: [], urls: [] };
							return {
								items: docs.map((d) => (d.data.title as string) || d.uid),
								urls: docs.map((d) => asLink(d.data.link) || '#')
							};
						})()
					: processLinks(primary?.collaborators || [])
			]);

			if (!isMounted) return;
			clientsItems = clientsResult.items;
			clientsUrls = clientsResult.urls;
			collaboratorsItems = collaboratorsResult.items;
			collaboratorsUrls = collaboratorsResult.urls;
		} catch (e) {
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

	const clientsTitle = $derived((slice.primary as any)?.clients_title || null);
	const collaboratorsTitle = $derived((slice.primary as any)?.collaborators_title || null);

	const leftItems = $derived(switchOrder ? collaboratorsItems : clientsItems);
	const leftUrls = $derived(switchOrder ? collaboratorsUrls : clientsUrls);
	const rightItems = $derived(switchOrder ? clientsItems : collaboratorsItems);
	const rightUrls = $derived(switchOrder ? clientsUrls : collaboratorsUrls);
	const leftTitle = $derived(switchOrder ? collaboratorsTitle : clientsTitle);
	const rightTitle = $derived(switchOrder ? clientsTitle : collaboratorsTitle);
</script>

<section
	class="mb-2 w-full"
	style="overflow-x: clip;"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-2">
		{#if mounted}
			<!-- Left box: white background, square, title bottom left -->
			<div class="min-w-0 flex flex-col bg-white rounded-lg overflow-hidden aspect-square w-full">
				<div class="flex-1 w-full relative flex justify-center min-h-[200px] md:min-h-[280px]">
					{#if leftItems.length > 0}
						<FanWheel
							items={leftItems}
							urls={leftUrls}
							radius={wheelRadius}
							rotationSpeed={rotationSpeed}
							fontSize={wheelFontSize}
							fit={isMobile ? 'safe' : 'tight'}
							bind:isHovering={clientsHovering}
						/>
					{/if}
				</div>
				{#if leftTitle}
					<div class="text-sm md:text-xl font-medium text-primary px-4 md:px-6 pb-4 md:pb-6 pt-0 text-left">
						{leftTitle}
					</div>
				{/if}
			</div>

			<!-- Right box: white background, square, title bottom left -->
			<div class="min-w-0 flex flex-col bg-white rounded-lg overflow-hidden aspect-square w-full">
				<div class="flex-1 w-full relative flex justify-center min-h-[200px] md:min-h-[280px]">
					{#if rightItems.length > 0}
						<FanWheel
							items={rightItems}
							urls={rightUrls}
							radius={wheelRadius}
							rotationSpeed={-rotationSpeed}
							fontSize={wheelFontSize}
							fit={isMobile ? 'safe' : 'tight'}
							bind:isHovering={collaboratorsHovering}
						/>
					{/if}
				</div>
				{#if rightTitle}
					<div class="text-sm md:text-xl font-medium text-primary px-4 md:px-6 pb-4 md:pb-6 pt-0 text-left">
						{rightTitle}
					</div>
				{/if}
			</div>
		{:else}
			<!-- SSR fallback -->
			<div class="w-full max-w-4xl mx-auto px-4 text-center text-primary">
				<div class="grid grid-cols-2 gap-8">
					<div>
						{#if clientsTitle}
							<div class="text-sm md:text-xl font-medium mb-4">{clientsTitle}</div>
						{/if}
						<div class="text-neutral-500">Loading...</div>
					</div>
					<div>
						{#if collaboratorsTitle}
							<div class="text-sm md:text-xl font-medium mb-4">{collaboratorsTitle}</div>
						{/if}
						<div class="text-neutral-500">Loading...</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>
