<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';


	type Props = SliceComponentProps<Content.SpacerSlice>;

	const { slice }: Props = $props();

	const sizeToPx: Record<NonNullable<Content.SpacerSliceDefaultPrimary['spacer_mobile']>, number> = {
		none: 0,
		xs: 16,
		sm: 48,
		md: 64,
		xl: 96,
		xxl: 128
	};

	const mobileSize = slice.primary.spacer_mobile ?? 'none';
	const desktopSize = slice.primary.spacer_desktop ?? mobileSize;

	const mobilePx = sizeToPx[mobileSize];
	const desktopPx = sizeToPx[desktopSize];

	// Use new boolean from model to control container width.
	// If true → use horizontal padding only (px-3). If false → use .content-container
	const primaryAny = (slice as any).primary || {};
	const usePaddingOnly: boolean = Boolean(primaryAny.max_width ?? primaryAny.full_width ?? false);
	const containerClass = usePaddingOnly ? 'px-3' : 'content-container';
</script>

<section
	class={`${containerClass} spacer`}
	style={`--pt:${mobilePx}px; --pb:${mobilePx}px; --pt-md:${desktopPx}px; --pb-md:${desktopPx}px;`}
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	{#if slice.primary.line}
		<div class="line" aria-hidden="true"></div>
	{/if}
</section>

<style>
	.spacer {
		padding-top: var(--pt);
		padding-bottom: var(--pb);
	}

	@media (min-width: 768px) {
		.spacer {
			padding-top: var(--pt-md);
			padding-bottom: var(--pb-md);
		}
	}

	.line {
		width: 100%;
		height: 1px;
		background-color: #e5e5e5;
	}
</style>
