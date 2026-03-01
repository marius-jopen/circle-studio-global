<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { PrismicRichText, type SliceComponentProps } from '@prismicio/svelte';
	import { isFilled } from '@prismicio/client';

	type Props = SliceComponentProps<Content.AboutOpenerSlice>;

	const { slice }: Props = $props();
</script>

{#if isFilled.richText(slice.primary.text)}
	<section
		class="content-container pt-[28vh] md:pt-60 pb-12 md:pb-20 text-left"
		data-slice-type={slice.slice_type}
		data-slice-variation={slice.variation}
	>
		<div class="about-opener-text text-primary">
			<PrismicRichText field={slice.primary.text} />
		</div>
	</section>
{/if}

<style>

	.about-opener-text :global(p) {
		font-size: clamp(1.75rem, 5.5vw, 3.7rem) !important;
		line-height: 1.20 !important;
		margin-bottom: 0.85em;
	}

	.about-opener-text :global(p:last-child) {
		margin-bottom: 0;
	}

	.about-opener-text :global(strong) {
		font-family: "CircularXXWebBold", inherit;
	}

	.about-opener-text :global(em) {
		font-style: italic;
	}

	.about-opener-text :global(a) {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
</style>
