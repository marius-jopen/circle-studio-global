<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import { asLink } from '@prismicio/client';
	import VideoPlayerSimple from '$lib/components/VideoPlayerSimple.svelte';
	import TextCircle from '$lib/components/TextCircle.svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { createClient } from '$lib/prismicio';
	import { onMount } from 'svelte';

	type Props = SliceComponentProps<Content.ContactMediaSlice>;

	const { slice }: Props = $props();

	const explicitVideoUrl = $derived((slice.primary as { video_url?: string | null }).video_url?.trim() ?? '');
	const imageField = $derived((slice.primary as { image?: { url?: string } }).image);
	const displayText = $derived((slice.primary as { text?: string | null }).text?.trim() ?? 'contact us');
	const copyValue = $derived((slice.primary as { mail?: string | null }).mail?.trim() ?? 'info@artcamp.io');
	const projectLinkField = $derived((slice.primary as any).project_link);
	const randomMode = $derived((slice.primary as any).random_project || 'off');

	// Fetch linked or random project data
	let fetchedPreviewVideo = $state('');
	let projectTitle = $state('');
	let projectClient = $state('');
	let projectDate = $state('');
	let resolvedProjectLink = $state<string | null>(null);

	onMount(async () => {
		try {
			const client = createClient();
			let doc: any = null;

			if (randomMode === 'random_project') {
				const allProjects = await client.getAllByType('projects', { pageSize: 100 });
				if (allProjects.length > 0) {
					doc = allProjects[Math.floor(Math.random() * allProjects.length)];
				}
			} else if (randomMode === 'random_featured_project') {
				const homePage = await client.getSingle('home');
				const featured = (homePage?.data?.feature_projects as any[]) ?? [];
				const featuredIds = featured
					.map((fp: any) => fp?.items?.id)
					.filter(Boolean);
				if (featuredIds.length > 0) {
					const randomId = featuredIds[Math.floor(Math.random() * featuredIds.length)];
					doc = await client.getByID(randomId);
				}
			} else if (projectLinkField?.uid) {
				doc = await client.getByUID('projects', projectLinkField.uid);
			}

			if (doc?.data) {
				projectTitle = (doc.data.title as string) || '';
				projectClient = (doc.data.client as string) || '';
				const year = (doc.data.year as string) || '';
				const month = (doc.data.month as string) || '';
				projectDate = month ? `${month} ${year}` : year;
				resolvedProjectLink = `/work/${doc.uid}`;

				if (!explicitVideoUrl) {
					const previews = (doc.data.preview as any[]) ?? [];
					for (const p of previews) {
						if (p?.preview_video_url_landscape) {
							fetchedPreviewVideo = p.preview_video_url_landscape.trim();
							break;
						}
					}
				}
			}
		} catch {}
	});

	const projectLink = $derived(
		resolvedProjectLink || (projectLinkField?.uid ? `/work/${projectLinkField.uid}` : asLink(projectLinkField))
	);

	// Hover state for BigWheel overlay
	let isHovering = $state(false);
	let hasEverHovered = $state(false);


	// Priority: explicit video URL > project's landscape preview video
	const videoUrl = $derived(explicitVideoUrl || fetchedPreviewVideo);

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

	const circleFontSize = $derived(Math.round(circleSize * 0.15));

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
	<div class="flex flex-col-reverse md:grid md:grid-cols-[2fr_1fr] md:aspect-[3/1] gap-2 md:gap-2 w-full">
		<!-- Left: Video (2/3 width) - same height as square -->
		{#if videoUrl}
			{#if projectLink}
				<a
					href={projectLink}
					class="{videoPanelClass} w-full aspect-square md:aspect-auto min-h-0 overflow-hidden cursor-pointer relative group"
					onmouseenter={() => { isHovering = true; hasEverHovered = true; }}
					onmouseleave={() => { isHovering = false; }}
				>
					<VideoPlayerSimple
						hlsUrl={videoUrl}
						posterImage={imageField}
						classes="w-full h-full object-cover pointer-events-none"
						dimension="landscape"
						itemsPerRow={1}
						containerSizePercent={100}
						enableOnMobile={true}
						square={false}
					/>
					<!-- Text overlay bottom left like ProjectItem -->
					{#if projectTitle || projectClient}
						<div class="absolute bottom-0 left-0 right-0 p-3 text-white pointer-events-none z-[1]">
							<div class="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
								{#if projectTitle}<div class="text-lg">{projectTitle}</div>{/if}
								{#if projectClient}<div class="text-lg opacity-60">{projectClient}</div>{/if}
							</div>
						</div>
					{/if}
				</a>
			{:else}
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
		{/if}

		<!-- Right: Circle text (1/3 width) - click to copy -->
		<div
			bind:this={circleBoxRef}
			class="{rightPanelClass} w-full aspect-square md:aspect-auto min-h-0 p-6 md:p-8"
		>
			<button
				type="button"
				onclick={handleCopy}
				class="group relative flex items-center justify-center w-full h-full cursor-pointer border-0 bg-transparent p-0 focus:outline-none rounded-lg"
				aria-label="Copy {copyValue} to clipboard"
			>
				<div
					class="flex items-center justify-center"
					style="width: {circleSize}px; height: {circleSize}px;"
				>
					<TextCircle
						text={circleText}
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
				<!-- Center: email (on hover) + copied message -->
				<div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-neutral-900 -translate-y-[3px]">
					<span class="text-sm md:text-base md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">{copyValue}</span>
					{#if copiedMessage}
						<span class="text-sm md:text-base mt-0.5">copied to your clipboard</span>
					{/if}
				</div>
			</button>
		</div>
	</div>
</section>
