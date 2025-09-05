<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import FanWheel from '$lib/components/FanWheel.svelte';
	import { createClient } from '$lib/prismicio';
	import { asLink } from '@prismicio/client';
	import { onMount } from 'svelte';

	type Props = SliceComponentProps<Content.WheelSlice>;

	const { slice }: Props = $props();

	let items = $state<string[]>([]);
	let urls = $state<string[]>([]);
	const rotationSpeed = 200;

	onMount(async () => {
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
			items = manualLinks.map((l) => l?.text || asLink(l) || '');
			urls = manualLinks.map((l) => asLink(l) || '#');
		}
	});
</script>

<section class="mb-8 mt-8" data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	<div class="flex justify-center items-center w-full pt-24 pb-24">
		<FanWheel {items} {urls} radius={200} rotationSpeed={rotationSpeed} fontSize={26} />
	</div>
</section>

<style>
</style>
