<script lang="ts">
	import { SliceZone } from '@prismicio/svelte';
	import type { PageProps } from './$types';

	import { components } from '$lib/slices';

	const { data }: PageProps = $props();
</script>

<div class="px-2">
	<SliceZone slices={data.page.data.slices} {components} />
</div>
