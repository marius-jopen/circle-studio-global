<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import TextCircle from '$lib/components/TextCircle.svelte';
	import VideoPlayerSimple from '$lib/components/VideoPlayerSimple.svelte';
	import { browser } from '$app/environment';

	type Props = SliceComponentProps<Content.ContactMediaSlice>;

	const { slice }: Props = $props();

	const videoUrl = $derived((slice.primary as { video_url?: string | null }).video_url?.trim() ?? '');
	const imageField = $derived((slice.primary as { image?: { url?: string } }).image);
	const copyText = $derived((slice.primary as { text?: string | null }).text?.trim() ?? 'info@artcamp.io');

	let circleSize = $state(360);
	let circleBoxRef = $state<HTMLDivElement | null>(null);
	let copiedMessage = $state<string | null>(null);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;

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
		if (!copyText) return;
		try {
			await navigator.clipboard.writeText(copyText);
			copiedMessage = `${copyText} copied to clipboard`;
			if (copyTimeout) clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => {
				copiedMessage = null;
			}, 2500);
		} catch {
			copiedMessage = 'Copy failed';
			if (copyTimeout) clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => {
				copiedMessage = null;
			}, 2500);
		}
	}

	const videoPanelClass =
		'bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0';
	const textPanelClass =
		'bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0';
</script>

<section
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	class="w-full"
>
	<div class="flex flex-col md:flex-row gap-2 md:gap-2 md:items-stretch w-full mb-2">
		<!-- Left: Video (2/3 width) - autoplay, muted -->
		{#if videoUrl}
			<div
				class="{videoPanelClass} w-full md:flex-[2] min-w-0 aspect-video md:aspect-video"
			>
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

		<!-- Right: Turning text (1/3 width) - click to copy -->
		<div
			bind:this={circleBoxRef}
			class="{textPanelClass} w-full md:flex-[1] min-w-0 aspect-square p-6 md:p-8 md:self-center relative"
		>
			{#if copyText}
				<button
					type="button"
					onclick={handleCopy}
					class="flex items-center justify-center w-full h-full cursor-pointer border-0 bg-transparent p-0 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 rounded-lg"
					aria-label="Copy {copyText} to clipboard"
				>
					<div
						class="flex items-center justify-center"
						style="width: {circleSize}px; height: {circleSize}px;"
					>
						<TextCircle
							text={copyText}
							containerSize={circleSize}
							fontSize={Math.round(circleSize * 0.13)}
							radius={Math.round(circleSize * 0.35)}
							rotationSpeed={0.1}
							spacingAmplitudePercent={0.5}
							spacingSpeed={0}
							animationType="sin"
							autoTextSize={false}
							manualMode={false}
							startInvisible={false}
						/>
					</div>
				</button>

				{#if copiedMessage}
					<div
						class="absolute bottom-4 left-4 right-4 md:left-6 md:right-6 md:bottom-6 text-sm md:text-base text-primary font-medium"
						role="status"
					>
						{copiedMessage}
					</div>
				{/if}
			{/if}
		</div>
	</div>
</section>
