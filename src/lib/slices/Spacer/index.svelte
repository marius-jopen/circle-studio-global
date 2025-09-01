<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';


	type Props = SliceComponentProps<Content.SpacerSlice>;

	const { slice }: Props = $props();

	// Map select values to Tailwind vertical padding scale
	const sizeToPaddingValue: Record<NonNullable<Content.SpacerSliceDefaultPrimary['spacer_mobile']>, number> = {
		none: 0,
		xs: 8,
		sm: 12,
		md: 16,
		xl: 24,
		xxl: 32
	};

	function getPyClass(size: Content.SpacerSliceDefaultPrimary['spacer_mobile']): string {
		const v = size ? sizeToPaddingValue[size] : 0;
		return v === 0 ? 'py-0' : `py-${v}`;
	}

	const mobileSize = slice.primary.spacer_mobile ?? 'none';
	const desktopSize = slice.primary.spacer_desktop ?? mobileSize;

	const mobilePy = getPyClass(mobileSize);
	const desktopPy = getPyClass(desktopSize);
</script>

<section
	class={`px-3 ${mobilePy} md:${desktopPy}`}
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	{#if slice.primary.line}
		<div class="w-full h-px bg-neutral-200" aria-hidden="true"></div>
	{/if}
</section>
