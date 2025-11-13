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
		<div class="h1 text-primary transition-colors duration-200 contact-link-wrapper">
			<PrismicLink field={slice.primary.link} />
		</div>
	{/if}
</section>

<style>
	.contact-link-wrapper {
		transition: color 200ms;
	}
	
	.contact-link-wrapper:hover {
		color: rgb(163 163 163); /* neutral-400 */
	}
	
	:global(.contact-link-wrapper a) {
		color: inherit;
		text-decoration: inherit;
	}
</style>
