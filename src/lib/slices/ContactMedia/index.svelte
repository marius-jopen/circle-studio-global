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

	// Pool of candidate projects for random modes
	let projectPool = $state<any[]>([]);
	let currentPoolIndex = $state(-1);

	// Double-buffer: two slots (A and B), activeSlot tracks which is visible
	let slotA = $state<{ video: string; title: string; client: string; date: string; link: string } | null>(null);
	let slotB = $state<{ video: string; title: string; client: string; date: string; link: string } | null>(null);
	let activeSlot = $state<'A' | 'B'>('A');

	const currentSlot = $derived(activeSlot === 'A' ? slotA : slotB);
	const nextSlot = $derived(activeSlot === 'A' ? slotB : slotA);

	function extractProjectData(doc: any) {
		const title = (doc.data.title as string) || '';
		const client = (doc.data.client as string) || '';
		const year = (doc.data.year as string) || '';
		const month = (doc.data.month as string) || '';
		const date = month ? `${month} ${year}` : year;
		const link = `/work/${doc.uid}`;
		let video = '';
		if (!explicitVideoUrl) {
			const previews = (doc.data.preview as any[]) ?? [];
			for (const p of previews) {
				if (p?.preview_video_url_landscape) {
					video = p.preview_video_url_landscape.trim();
					break;
				}
			}
		}
		return { video, title, client, date, link };
	}

	function applyProjectData(data: { video: string; title: string; client: string; date: string; link: string }) {
		fetchedPreviewVideo = data.video;
		projectTitle = data.title;
		projectClient = data.client;
		projectDate = data.date;
		resolvedProjectLink = data.link;
	}

	function shuffleArray(arr: any[]) {
		const shuffled = [...arr];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	function prepareNextSlot() {
		if (projectPool.length < 2) return;
		const nextIndex = (currentPoolIndex + 1) % projectPool.length;
		const doc = projectPool[nextIndex];
		if (doc?.data) {
			const data = extractProjectData(doc);
			if (activeSlot === 'A') {
				slotB = data;
			} else {
				slotA = data;
			}
		}
	}

	function showNextProject() {
		if (projectPool.length < 2) return;
		const next = activeSlot === 'A' ? slotB : slotA;
		if (!next) return;
		currentPoolIndex = (currentPoolIndex + 1) % projectPool.length;
		applyProjectData(next);
		activeSlot = activeSlot === 'A' ? 'B' : 'A';
		prepareNextSlot();
	}

	const isRandomMode = $derived(randomMode === 'random_project' || randomMode === 'random_featured_project');

	onMount(async () => {
		try {
			const client = createClient();
			let doc: any = null;

			if (randomMode === 'random_project') {
				const allProjects = await client.getAllByType('projects', { pageSize: 100 });
				projectPool = shuffleArray(allProjects);
				if (projectPool.length > 0) {
					currentPoolIndex = 0;
					doc = projectPool[0];
				}
			} else if (randomMode === 'random_featured_project') {
				const homePage = await client.getSingle('home');
				const featured = (homePage?.data?.feature_projects as any[]) ?? [];
				const featuredIds = featured
					.map((fp: any) => fp?.items?.id)
					.filter(Boolean);
				if (featuredIds.length > 0) {
					const docs = await Promise.all(featuredIds.map((id: string) => client.getByID(id).catch(() => null)));
					projectPool = shuffleArray(docs.filter(Boolean));
					if (projectPool.length > 0) {
						currentPoolIndex = 0;
						doc = projectPool[0];
					}
				}
			} else if (projectLinkField?.uid) {
				doc = await client.getByUID('projects', projectLinkField.uid);
			}

			if (doc?.data) {
				const data = extractProjectData(doc);
				slotA = data;
				applyProjectData(data);
				prepareNextSlot();
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
					<!-- Double-buffered video players for instant switching -->
					{#if slotA?.video}
						<div class="absolute inset-0" class:z-[1]={activeSlot === 'A'} class:z-0={activeSlot !== 'A'}>
							{#key slotA.video}
								<VideoPlayerSimple
									hlsUrl={explicitVideoUrl || slotA.video}
									posterImage={imageField}
									classes="w-full h-full object-cover pointer-events-none"
									dimension="landscape"
									itemsPerRow={1}
									containerSizePercent={100}
									enableOnMobile={true}
									square={false}
								/>
							{/key}
						</div>
					{/if}
					{#if slotB?.video}
						<div class="absolute inset-0" class:z-[1]={activeSlot === 'B'} class:z-0={activeSlot !== 'B'}>
							{#key slotB.video}
								<VideoPlayerSimple
									hlsUrl={explicitVideoUrl || slotB.video}
									posterImage={imageField}
									classes="w-full h-full object-cover pointer-events-none"
									dimension="landscape"
									itemsPerRow={1}
									containerSizePercent={100}
									enableOnMobile={true}
									square={false}
								/>
							{/key}
						</div>
					{/if}
					<!-- Fallback for non-random mode (single video) -->
					{#if !isRandomMode}
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
					{/if}
					<!-- Text overlay bottom left like ProjectItem -->
					{#if projectTitle || projectClient}
						<div class="absolute bottom-0 left-0 right-0 p-3 text-white pointer-events-none z-[1]">
							<div class="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
								{#if projectTitle}<div class="text-lg">{projectTitle}</div>{/if}
								{#if projectClient}<div class="text-lg opacity-60">{projectClient}</div>{/if}
							</div>
						</div>
					{/if}
					<!-- Next random project button -->
					{#if isRandomMode && projectPool.length > 1}
						<button
							type="button"
							onclick={(e) => { e.preventDefault(); e.stopPropagation(); showNextProject(); }}
							class="absolute bottom-[7px] right-[7px] z-[2] h-10 px-3 rounded-md bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors duration-200 pointer-events-auto cursor-pointer"
							aria-label="Next random project"
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M5 12h14M12 5l7 7-7 7"/>
							</svg>
						</button>
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
