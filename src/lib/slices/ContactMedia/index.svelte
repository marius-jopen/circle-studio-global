<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import VideoPlayerSimple from '$lib/components/VideoPlayerSimple.svelte';
	import TextCircle from '$lib/components/TextCircle.svelte';
	import { browser } from '$app/environment';

	type Props = SliceComponentProps<Content.ContactMediaSlice>;

	const { slice }: Props = $props();

	const videoUrl = $derived((slice.primary as { video_url?: string | null }).video_url?.trim() ?? '');
	const imageField = $derived((slice.primary as { image?: { url?: string } }).image);
	const displayText = $derived((slice.primary as { text?: string | null }).text?.trim() ?? 'contact us');
	const copyValue = $derived((slice.primary as { mail?: string | null }).mail?.trim() ?? 'info@artcamp.io');

	// Text shown 3 times: "contact us contact us contact us"
	const circleText = $derived([displayText, displayText, displayText].join(' '));

	let circleSize = $state(360);
	let circleBoxRef = $state<HTMLDivElement | null>(null);
	let copiedMessage = $state<string | null>(null);

	$effect(() => {
		const el = circleBoxRef;
		if (!el || !browser) return;
		const updateSize = () => {
			const w = el.clientWidth;
			circleSize = Math.max(200, w - 48);
		};
		updateSize();
		const ro = new ResizeObserver(updateSize);
		ro.observe(el);
		window.addEventListener('resize', updateSize);
		return () => {
			ro.disconnect();
			window.removeEventListener('resize', updateSize);
		};
	});

	async function handleCopy() {
		if (!copyValue) return;
		try {
			await navigator.clipboard.writeText(copyValue);
			copiedMessage = `${copyValue} copied to clipboard`;
			setTimeout(() => (copiedMessage = null), 2500);
		} catch {
			copiedMessage = 'Copy failed';
			setTimeout(() => (copiedMessage = null), 2500);
		}
	}

	const textToShow = $derived(copiedMessage ?? circleText);
	const circleFontSize = $derived(
		copiedMessage ? Math.round(circleSize * 0.132) : Math.round(circleSize * 0.15)
	);

	const videoPanelClass =
		'bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0';
	const rightPanelClass =
		'bg-white rounded-lg shrink-0 min-w-0 aspect-square flex items-center justify-center overflow-hidden border-0 outline-none';
</script>

<section
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	class="w-full mb-2"
>
	<!-- Grid: 2/3 video + 1/3 square. aspect-[3/1] makes height = width/3 so square is 1:1 and video matches height -->
	<div class="flex flex-col md:grid md:grid-cols-[2fr_1fr] md:aspect-[3/1] gap-2 md:gap-2 w-full">
		<!-- Left: Video (2/3 width) - same height as square -->
		{#if videoUrl}
			<div class="{videoPanelClass} w-full aspect-video md:aspect-auto min-h-0 overflow-hidden">
				<VideoPlayerSimple
					hlsUrl={videoUrl}
					posterImage={imageField}
					classes="w-full h-full object-cover"
					dimension="landscape"
					itemsPerRow={1}
					containerSizePercent={100}
					enableOnMobile={true}
					square={false}
				/>
			</div>
		{/if}

		<!-- Right: Circle text (1/3 width) - click to copy -->
		<div
			bind:this={circleBoxRef}
			class="{rightPanelClass} w-full aspect-square md:aspect-auto min-h-0 p-6 md:p-8"
		>
			<button
				type="button"
				onclick={handleCopy}
				class="flex items-center justify-center w-full h-full cursor-pointer border-0 bg-transparent p-0 focus:outline-none rounded-lg"
				aria-label="Copy {copyValue} to clipboard"
			>
				<div
					class="flex items-center justify-center"
					style="width: {circleSize}px; height: {circleSize}px;"
				>
					<TextCircle
						text={textToShow}
						containerSize={circleSize}
						fontSize={circleFontSize}
						radius={Math.round(circleSize * 0.35)}
						rotationSpeed={0.1}
						spacingAmplitudePercent={0.5}
						spacingSpeed={0}
						animationType="sin"
						autoTextSize={false}
						manualMode={true}
						startInvisible={false}
					/>
				</div>
			</button>
		</div>
	</div>
</section>
