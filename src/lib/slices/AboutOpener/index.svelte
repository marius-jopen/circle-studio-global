<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { PrismicRichText, type SliceComponentProps } from '@prismicio/svelte';
	import { isFilled } from '@prismicio/client';

	type Props = SliceComponentProps<Content.AboutOpenerSlice>;

	const { slice }: Props = $props();
</script>

{#if isFilled.richText(slice.primary.text)}
	<section
		class="md:w-8/12 mx-auto pt-24 md:pt-48 pb-12 md:pb-20 text-left text-primary px-6 md:px-0"
		data-slice-type={slice.slice_type}
		data-slice-variation={slice.variation}
	>
		<div class="about-opener-text">
			<PrismicRichText field={slice.primary.text} />
		</div>
	</section>
{/if}
