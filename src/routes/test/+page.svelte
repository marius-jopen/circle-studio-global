<script lang="ts">
	import { SliceZone } from '@prismicio/svelte';
	import { components } from '$lib/slices';

	export let data;
</script>

<svelte:head>
	<title>About — Test</title>
</svelte:head>

<div class="px-2">
	{#if data.page?.data?.slices}
		<SliceZone slices={data.page.data.slices} {components} />
	{:else}
		<div class="py-12 text-center text-neutral-500">
			No Prismic page found at UID "test". Create one in Prismic with the slices you want to test.
		</div>
	{/if}
</div>
