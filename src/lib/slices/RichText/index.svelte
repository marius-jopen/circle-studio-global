<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { PrismicRichText, type SliceComponentProps } from '@prismicio/svelte';

	type Props = SliceComponentProps<Content.RichTextSlice>;

	const { slice }: Props = $props();

	const centered = $derived(slice.primary.centered ?? false);
	const xDistance = $derived(slice.primary.x_distance ?? 'none');
	const bottomDistance = $derived(slice.primary.bottom_distance ?? 'none');
	const columns = $derived((slice.primary as any).columns ?? '1');

	// Map x_distance to max-width classes (fraction of container)
	const maxWidthClass = $derived.by(() => {
		switch (xDistance) {
			case 'sm': return 'md:max-w-11/12 mx-auto';      // 6/12
			case 'md': return 'md:max-w-10/12 mx-auto';   // 8/12
			case 'lg': return 'md:max-w-9/12 mx-auto';   // 10/12
			case 'xl': return 'md:max-w-8/12 mx-auto';   // 11/12
			default: return 'max-w-full';          // 12/12
		}
	});

	// Map bottom_distance to padding-bottom classes
	const bottomPaddingClass = $derived.by(() => {
		switch (bottomDistance) {
			case 'sm': return 'pb-4';
			case 'md': return 'pb-8';
			case 'lg': return 'pb-16';
			case 'xl': return 'pb-24';
			default: return '';
		}
	});

	const centerClass = $derived(centered ? 'text-center mx-auto' : '');
	
	// Map columns to CSS column-count (only on desktop, mobile stays single column)
	const columnCount = $derived(parseInt(columns) || 1);
</script>

<section class="px-6 text-primary content-text {maxWidthClass} {centerClass} {bottomPaddingClass}">
	<div class="rich-text-content" style={columnCount > 1 ? `--column-count: ${columnCount};` : ''}>
		<PrismicRichText field={slice.primary.content} />
	</div>
</section>

<style>
	.rich-text-content {
		column-count: 1;
		column-gap: 2rem;
	}
	
	@media (min-width: 768px) {
		.rich-text-content {
			column-count: var(--column-count, 1);
		}
	}
</style>
