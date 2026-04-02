<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { createClient } from '$lib/prismicio';
	import { parseBoldText } from '$lib/utils/boldText';

	// OG image dimensions
	const OG_WIDTH = 1200;
	const OG_HEIGHT = 630;

	// State
	let projects = $state<any[]>([]);
	let selectedProjectUid = $state('');
	let selectedProject = $state<any>(null);
	let previewImages = $state<{ url: string; label: string }[]>([]);
	let selectedImageUrl = $state('');
	let loadedImage = $state<HTMLImageElement | null>(null);
	let darkOverlay = $state(true);

	// Separate scrubbers for each circle
	let scrubTime1 = $state(0);
	let scrubTime2 = $state(0);
	const MAX_SCRUB_TIME = 10;

	// Canvas
	let canvas = $state<HTMLCanvasElement | null>(null);
	let logoImg = $state<HTMLImageElement | null>(null);

	// Font family
	const FONT_FAMILY = '"CircularXXWeb", Arial, Helvetica, sans-serif';

	// Circle config matching projectItem
	const BASE_CONTAINER_SIZE = 600;
	const CONTAINER_SIZE_PERCENT = 110;
	const FONT_SIZE_PERCENT = 10;
	const DISTANCE_PERCENT = 1.5;

	onMount(async () => {
		const img = new Image();
		img.src = '/logo-white.png';
		img.onload = () => { logoImg = img; drawCanvas(); };

		const client = createClient();
		const allProjects = await client.getAllByType('projects', { pageSize: 100 });
		projects = allProjects.sort((a, b) => {
			const titleA = (a.data.title as string) || '';
			const titleB = (b.data.title as string) || '';
			return titleA.localeCompare(titleB);
		});
	});

	function onProjectChange() {
		if (!selectedProjectUid || !browser) return;
		const project = projects.find(p => p.uid === selectedProjectUid);
		if (!project) return;
		selectedProject = project;

		const previews = (project.data.preview as any[]) ?? [];
		const images: { url: string; label: string }[] = [];
		previews.forEach((p, i) => {
			if (p?.preview_image_landscape?.url) {
				images.push({ url: p.preview_image_landscape.url, label: `Landscape ${i + 1}` });
			}
		});
		previewImages = images;
		if (images.length > 0) {
			selectImage(images[0].url);
		} else {
			selectedImageUrl = '';
			loadedImage = null;
			drawCanvas();
		}
	}

	function selectImage(url: string) {
		if (!url || !browser) return;
		selectedImageUrl = url;
		loadedImage = null;
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			loadedImage = img;
			requestAnimationFrame(() => drawCanvas());
		};
		img.src = url;
	}

	$effect(() => {
		if (browser) {
			void scrubTime1;
			void scrubTime2;
			void darkOverlay;
			drawCanvas();
		}
	});

	function drawCircularText(
		ctx: CanvasRenderingContext2D,
		text: string,
		centerX: number,
		centerY: number,
		radius: number,
		fontSize: number,
		rotationSpeed: number,
		spacingAmplitudePercent: number,
		spacingSpeed: number,
		rotationStart: number,
		scrubTime: number
	) {
		const letters = parseBoldText(text);
		if (letters.length === 0) return;

		ctx.save();
		ctx.translate(centerX, centerY);

		const rotation = scrubTime * rotationSpeed;
		ctx.rotate(rotation + (rotationStart * Math.PI / 180));

		const letterWidths = letters.map(({ char, bold }) => {
			ctx.font = bold ? `bold ${fontSize}px ${FONT_FAMILY}` : `${fontSize}px ${FONT_FAMILY}`;
			return ctx.measureText(char).width;
		});
		const totalWidth = letterWidths.reduce((a, b) => a + b, 0);
		const circumference = 2 * Math.PI * radius;
		const maxSpacingTotal = Math.max(0, circumference - totalWidth);
		const maxSpacingPerLetter = letters.length > 0 ? maxSpacingTotal / letters.length : 0;
		const maxSpacingPercent = (maxSpacingPerLetter / circumference) * 100;
		const spacingAmplitude = Math.min(spacingAmplitudePercent, maxSpacingPercent);

		let animValue = 0.5 + 0.5 * Math.sin(scrubTime * spacingSpeed * 2 * Math.PI);

		let currentAngle = 0;
		for (let i = 0; i < letters.length; i++) {
			const letterArc = (letterWidths[i] / circumference) * 2 * Math.PI;
			const spacing = (spacingAmplitude / 100) * circumference * animValue;
			const spacingArc = (spacing / circumference) * 2 * Math.PI;
			const angle = currentAngle + letterArc / 2;

			ctx.save();
			ctx.rotate(angle);
			ctx.translate(0, -radius);

			const { char, bold } = letters[i];
			ctx.font = bold ? `bold ${fontSize}px ${FONT_FAMILY}` : `${fontSize}px ${FONT_FAMILY}`;
			ctx.fillStyle = 'rgba(255, 255, 255, 1)';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'alphabetic';
			ctx.fillText(char, 0, 0);

			ctx.restore();
			currentAngle += letterArc + spacingArc;
		}

		ctx.restore();
	}

	function drawCanvas() {
		if (!canvas || !browser) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		canvas.width = OG_WIDTH;
		canvas.height = OG_HEIGHT;

		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

		if (loadedImage) {
			// Cover fit — scale to fill with 1px overflow to prevent subpixel gaps
			const scale = Math.max(OG_WIDTH / loadedImage.width, OG_HEIGHT / loadedImage.height);
			const dw = Math.ceil(loadedImage.width * scale) + 2;
			const dh = Math.ceil(loadedImage.height * scale) + 2;
			const dx = Math.floor((OG_WIDTH - dw) / 2);
			const dy = Math.floor((OG_HEIGHT - dh) / 2);
			ctx.drawImage(loadedImage, dx, dy, dw, dh);

			if (darkOverlay) {
				ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
				ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);
			}
		}

		// Calculate circle sizes — constrain to OG_HEIGHT so circles are centered
		const containerSize = (CONTAINER_SIZE_PERCENT / 100) * BASE_CONTAINER_SIZE;
		const fontSize = (FONT_SIZE_PERCENT / 100) * containerSize;
		const distanceBetweenCircles = (DISTANCE_PERCENT / 100) * containerSize;
		const outermostRadius = (containerSize / 2) - fontSize * 1.2;
		const getRadius = (i: number) => outermostRadius - i * (fontSize + distanceBetweenCircles);

		// Scale based on height so circles fit vertically centered
		const scale = (OG_HEIGHT * 0.9) / containerSize;
		const centerX = OG_WIDTH / 2;
		const centerY = OG_HEIGHT / 2;

		const projectTitleRaw = selectedProject?.data?.title || 'Project Title';
		const projectClientRaw = selectedProject?.data?.client || 'Client';
		const projectTitle = projectTitleRaw.length > 40 ? projectTitleRaw.substring(0, 40) + '...' : projectTitleRaw;
		const projectClient = projectClientRaw.length > 27 ? projectClientRaw.substring(0, 27) + '...' : projectClientRaw;

		drawCircularText(
			ctx, projectTitle, centerX, centerY,
			getRadius(0) * scale, fontSize * scale,
			0.3, 0, 0.2, 0, scrubTime1
		);

		drawCircularText(
			ctx, projectClient, centerX, centerY,
			getRadius(1) * scale, fontSize * scale,
			0.25, 0, 0.2, 180, scrubTime2
		);

		if (logoImg) {
			const logoSize = 117;
			const logoPadding = 20;
			ctx.drawImage(logoImg, logoPadding, logoPadding, logoSize, logoSize);
		}
	}

	function downloadPng() {
		if (!canvas) return;
		const link = document.createElement('a');
		const projectName = selectedProject?.data?.title || 'og-image';
		link.download = `og-${projectName.toLowerCase().replace(/\s+/g, '-')}.png`;
		link.href = canvas.toDataURL('image/png');
		link.click();
	}
</script>

<svelte:head>
	<title>OG Image Generator</title>
</svelte:head>

<div class="max-w-7xl mx-auto">
	<div class="grid grid-cols-[300px_1fr] gap-6">
		<!-- Left: Controls -->
		<div class="flex flex-col gap-4">
			<h1 class="text-xl font-bold text-gray-900">OG Generator</h1>

			<!-- Project selector -->
			<div>
				<label for="project-select" class="block text-xs font-medium text-gray-500 mb-1">Project</label>
				<select
					id="project-select"
					bind:value={selectedProjectUid}
					onchange={onProjectChange}
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
				>
					<option value="">Select a project...</option>
					{#each projects as project}
						<option value={project.uid}>{project.data.title || project.uid}</option>
					{/each}
				</select>
			</div>

			<!-- Thumbnail grid -->
			{#if previewImages.length > 0}
				<div>
					<span class="block text-xs font-medium text-gray-500 mb-1">Preview Image</span>
					<div class="grid grid-cols-3 gap-1.5">
						{#each previewImages as img}
							<button
								type="button"
								onclick={() => selectImage(img.url)}
								class="aspect-video rounded overflow-hidden border-2 transition-colors cursor-pointer {selectedImageUrl === img.url ? 'border-black' : 'border-transparent hover:border-gray-300'}"
							>
								<img src={img.url} alt={img.label} class="w-full h-full object-cover" />
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Circle 1 scrubber -->
			<div>
				<label for="scrub1" class="block text-xs font-medium text-gray-500 mb-1">
					Title rotation: {scrubTime1.toFixed(1)}s
				</label>
				<input
					id="scrub1"
					type="range"
					min="0"
					max={MAX_SCRUB_TIME}
					step="0.05"
					bind:value={scrubTime1}
					class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
				/>
			</div>

			<!-- Circle 2 scrubber -->
			<div>
				<label for="scrub2" class="block text-xs font-medium text-gray-500 mb-1">
					Client rotation: {scrubTime2.toFixed(1)}s
				</label>
				<input
					id="scrub2"
					type="range"
					min="0"
					max={MAX_SCRUB_TIME}
					step="0.05"
					bind:value={scrubTime2}
					class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
				/>
			</div>

			<!-- Dark overlay toggle -->
			<label class="flex items-center gap-2 text-sm cursor-pointer">
				<input type="checkbox" bind:checked={darkOverlay} class="rounded" />
				<span class="text-gray-700">Dark overlay</span>
			</label>

			<!-- Download button -->
			<button
				onclick={downloadPng}
				disabled={!loadedImage}
				class="rounded-md bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
			>
				Download PNG (1200x630)
			</button>

			<!-- Project info -->
			{#if selectedProject}
				<div class="text-xs text-gray-400 mt-1">
					<div><span class="text-gray-500">Title:</span> {selectedProject.data?.title || '—'}</div>
					<div><span class="text-gray-500">Client:</span> {selectedProject.data?.client || '—'}</div>
				</div>
			{/if}
		</div>

		<!-- Right: Canvas preview -->
		<div class="rounded-lg overflow-hidden shadow-lg" style="aspect-ratio: {OG_WIDTH}/{OG_HEIGHT};">
			<canvas
				bind:this={canvas}
				width={OG_WIDTH}
				height={OG_HEIGHT}
				class="w-full h-full block"
			/>
		</div>
	</div>
</div>
