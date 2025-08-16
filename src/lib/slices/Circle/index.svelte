<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import { onMount } from 'svelte';
	import BigWheel from '$lib/components/BigWheel.svelte';

	type Props = SliceComponentProps<Content.CircleSlice>;

	const { slice }: Props = $props();

	// Collect non-empty texts from the repeatable group
	const texts = (slice.primary.items ?? [])
		.map((item) => item.text ?? '')
		.filter((t) => t && t.trim().length > 0);

	// Choose a random text on client only to avoid SSR hydration mismatch
	let selectedText = $state<string | null>(null);
	onMount(() => {
		if (texts.length > 0) {
			selectedText = texts[Math.floor(Math.random() * texts.length)];
		}
	});
</script>

<section data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	<div class="flex justify-center items-center w-full pt-24 pb-24">
		{#if selectedText}
			<BigWheel
				config={{
					uiVisible: false,
					items: [
						{
							text: selectedText,
							rotationSpeed: 0.2,
							spacingAmplitudePercent: 0,
							spacingSpeed: 0,
							rotationStart: 0,
							animationType: 'sin',
							autoTextSize: true,
						}
					],
					globalSettings: {
						containerSizePercent: 100,
						fontSizePercent: 9,
						distancePercent: 0,
						paused: false,
						textColor: '#000000',
						transparentBackground: true,
						manualMode: true,
						fadeInTime: 0,
						fadeOutTime: 0
					}
				}}
			/>
		{/if}
	</div>
</section>
