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
		const client = createClient();
		const docs = await client.getAllByType('people', {
			orderings: [{ field: 'my.people.name', direction: 'asc' }],
			pageSize: 200
		});
		items = docs.map((d) => (d.data.name as string) || d.uid);
		urls = docs.map((d) => asLink(d.data.link) || '#');
	});
</script>

<section class="pt-24" data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	<div class="flex justify-center items-center w-full pt-24 pb-24">
		<FanWheel {items} {urls} radius={200} rotationSpeed={rotationSpeed} fontSize={26} />
	</div>
</section>

<style>
</style>
