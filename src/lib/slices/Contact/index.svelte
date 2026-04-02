<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import { isFilled, asLink } from '@prismicio/client';
	import TextCircle from '$lib/components/TextCircle.svelte';
	import { browser } from '$app/environment';

	type Props = SliceComponentProps<Content.ContactSlice>;

	const { slice }: Props = $props();

	let linkUrl = $derived(asLink(slice.primary.link) || '');
	let linkText = $derived(slice.primary.link?.text || linkUrl || '');

	// Text shown 3 times around the circle
	const displayText = $derived(linkText || 'contact us');
	const circleText = $derived([displayText, displayText, displayText, displayText].join(' '));

	let copiedMessage = $state<string | null>(null);

	// Circle size: 30vw, measured from a container
	let circleSize = $state(360);
	let circleBoxRef = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (!browser) return;
		const updateSize = () => {
			const isMobile = window.innerWidth < 768;
			circleSize = Math.max(200, Math.round(window.innerWidth * (isMobile ? 0.82 : 0.3)));
		};
		updateSize();
		window.addEventListener('resize', updateSize);
		return () => window.removeEventListener('resize', updateSize);
	});

	const isMobile = $derived(browser && window.innerWidth < 768);
	const circleFontSize = $derived(Math.round(circleSize * (isMobile ? 0.1575 : 0.15)));

	async function handleCopy() {
		if (!linkUrl) return;
		try {
			await navigator.clipboard.writeText(linkUrl);
			copiedMessage = `${linkUrl} copied to clipboard`;
			setTimeout(() => (copiedMessage = null), 2500);
		} catch {
			copiedMessage = 'Copy failed';
			setTimeout(() => (copiedMessage = null), 2500);
		}
	}
</script>

<section
	class="mb-2 -mt-1 bg-neutral-100 rounded px-4 aspect-square md:aspect-auto md:py-28 flex items-center justify-center"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	{#if isFilled.link(slice.primary.link)}
		<div class="flex items-center justify-center">
			<button
				type="button"
				onclick={handleCopy}
				class="group relative flex items-center justify-center cursor-pointer border-0 bg-transparent p-0 focus:outline-none"
				aria-label="Copy {linkUrl} to clipboard"
			>
				<div
					class="flex items-center justify-center"
					style="width: {circleSize}px; height: {circleSize}px;"
				>
					<TextCircle
						text={circleText}
						containerSize={circleSize}
						fontSize={38}
						radius={Math.round(circleSize * 0.32)}
						rotationSpeed={0.1}
						spacingAmplitudePercent={0.5}
						spacingSpeed={0}
						animationType="sin"
						autoTextSize={true}
						autoRadius={true}
						manualMode={true}
						startInvisible={false}
					/>
				</div>
				<!-- Center: email (on hover) + copied message -->
				<div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-neutral-900 -translate-y-[3px]">
					<span class="text-sm md:text-base md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">{linkUrl}</span>
					{#if copiedMessage}
						<span class="text-sm md:text-base mt-0.5">copied to your clipboard</span>
					{/if}
				</div>
			</button>
		</div>
	{/if}
</section>
