<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import { PrismicLink } from '@prismicio/svelte';
	import { isFilled } from '@prismicio/client';

	type Props = SliceComponentProps<Content.ContactSlice>;

	const { slice }: Props = $props();
</script>

<section class="content-container mb-10 mt-10 text-center" data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	{#if isFilled.link(slice.primary.link)}
		<div class="h1 text-primary hover:text-neutral-400 transition-colors duration-200">
			<PrismicLink field={slice.primary.link} />
		</div>
	{/if}
</section>
