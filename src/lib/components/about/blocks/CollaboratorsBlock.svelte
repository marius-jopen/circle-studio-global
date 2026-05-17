<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import FanWheel from '$lib/components/FanWheel.svelte';
	import { createClient } from '$lib/prismicio';
	import type { CollaboratorsBlock } from '$lib/types/aboutBlock';

	export let block: CollaboratorsBlock;
	void block;

	let items: string[] = [];
	let urls: (string | null | undefined)[] = [];
	let radius = 140;

	const updateRadius = () => {
		if (typeof window === 'undefined') return;
		radius =
			window.innerWidth < 768 ? Math.min(window.innerWidth * 0.22, 110) : 140;
	};

	async function fetchPeople() {
		try {
			const client = createClient();
			const people = await client.getAllByType('people');
			items = people.map((p) => (p.data as { title?: string })?.title ?? '').filter(Boolean);
			urls = people.map((p) => {
				const link = (p.data as { link?: { url?: string } })?.link;
				return link?.url ?? null;
			});
		} catch {
			items = ['Sample One', 'Sample Two', 'Sample Three'];
		}
	}

	onMount(() => {
		fetchPeople();
		updateRadius();
		window.addEventListener('resize', updateRadius);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', updateRadius);
		}
	});
</script>

<div class="flex h-full w-full items-center justify-center">
	{#if items.length > 0}
		<FanWheel {items} {urls} {radius} rotationSpeed={60} fontSize={18} />
	{/if}
</div>
