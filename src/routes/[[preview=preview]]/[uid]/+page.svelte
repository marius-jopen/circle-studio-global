<script lang="ts">
	import { SliceZone } from '@prismicio/svelte';
	import type { PageProps } from './$types';

	import { components } from '$lib/slices';

	const { data }: PageProps = $props();
	const isAboutNew = $derived(data?.page?.uid === 'about-new');
</script>

<div class="px-2 {isAboutNew ? 'bg-neutral-100 min-h-screen' : ''}">
	<SliceZone slices={data.page.data.slices} {components} />
</div>
