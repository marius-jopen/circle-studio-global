<script lang="ts">
	import { PrismicPreview } from '@prismicio/svelte/kit';
	import { page } from '$app/state';
	import { repositoryName } from '$lib/prismicio';
	import Header from '$lib/components/Header.svelte';
	import Welcome from '$lib/components/Welcome.svelte';
	import { onMount } from 'svelte';
	import "../app.css";

	let { children, data } = $props();
	
	// Global navigation click detection for video autoplay permissions
	let headerFaded = $state(false);
	let mainMediaVisible = $state(true);
	let soundContexts = new Map<string, Set<string>>();
	let controlsVisibleContexts = new Map<string, Set<string>>();

	onMount(() => {
		const handleNavigationClick = (e: Event) => {
			const target = e.target as HTMLElement;
			if (target.closest('a') || target.closest('button')) {
				sessionStorage.setItem('circle-studio-navigating', 'true');
				sessionStorage.setItem('user-has-interacted', 'true');
				console.log('🌐 Global navigation click detected, stored both flags');
			}
		};

		const handleVideoSoundOn = (e: Event) => {
			const { context, videoId } = (e as CustomEvent).detail || {};
			if (!context || !videoId) return updateHeaderState();
			if (!soundContexts.has(context)) soundContexts.set(context, new Set());
			soundContexts.get(context)!.add(videoId);
			updateHeaderState();
		};
		const handleVideoSoundOff = (e: Event) => {
			const { context, videoId } = (e as CustomEvent).detail || {};
			if (!context || !videoId) return updateHeaderState();
			const set = soundContexts.get(context);
			if (set) {
				set.delete(videoId);
				if (set.size === 0) soundContexts.delete(context);
			}
			updateHeaderState();
		};

		const handleControlsShown = (e: Event) => {
			const { context, videoId } = (e as CustomEvent).detail || {};
			if (!context || !videoId) return updateHeaderState();
			if (!controlsVisibleContexts.has(context)) controlsVisibleContexts.set(context, new Set());
			controlsVisibleContexts.get(context)!.add(videoId);
			updateHeaderState();
		};
		const handleControlsHidden = (e: Event) => {
			const { context, videoId } = (e as CustomEvent).detail || {};
			if (!context || !videoId) return updateHeaderState();
			const set = controlsVisibleContexts.get(context);
			if (set) {
				set.delete(videoId);
				if (set.size === 0) controlsVisibleContexts.delete(context);
			}
			updateHeaderState();
		};

		function updateHeaderState() {
			const controlsMainVisible = (controlsVisibleContexts.get('main')?.size ?? 0) > 0;
			if (controlsMainVisible) {
				headerFaded = false;
				return;
			}
			const soundMainOn = (soundContexts.get('main')?.size ?? 0) > 0;
			headerFaded = !!(mainMediaVisible && soundMainOn);
		}

		// Listen for all clicks globally
		document.addEventListener('click', handleNavigationClick);
		// Listen for video sound events
		window.addEventListener('video-playing-with-sound', handleVideoSoundOn as EventListener);
		window.addEventListener('video-sound-off', handleVideoSoundOff as EventListener);
		window.addEventListener('video-controls-shown', handleControlsShown as EventListener);
		window.addEventListener('video-controls-hidden', handleControlsHidden as EventListener);
		
		// Observe main media visibility
		const mainEl = document.getElementById('main-media');
		let io: IntersectionObserver | undefined;
		if (mainEl && 'IntersectionObserver' in window) {
			io = new IntersectionObserver((entries) => {
				const entry = entries[0];
				mainMediaVisible = entry.isIntersecting && entry.intersectionRatio > 0;
				updateHeaderState();
			}, { threshold: [0, 0.01, 0.1] });
			io.observe(mainEl);
		}
		
		return () => {
			document.removeEventListener('click', handleNavigationClick);
			window.removeEventListener('video-playing-with-sound', handleVideoSoundOn as EventListener);
			window.removeEventListener('video-sound-off', handleVideoSoundOff as EventListener);
			window.removeEventListener('video-controls-shown', handleControlsShown as EventListener);
			window.removeEventListener('video-controls-hidden', handleControlsHidden as EventListener);
			if (io && mainEl) io.unobserve(mainEl);
		};
	});
</script>

<svelte:head>
	<title>{page.data.title}</title>
	{#if page.data.meta_description}
		<meta name="description" content={page.data.meta_description} />
	{/if}
	{#if page.data.meta_title}
		<meta name="og:title" content={page.data.meta_title} />
	{/if}
	{#if page.data.meta_image}
		<meta name="og:image" content={page.data.meta_image} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
</svelte:head>

<Welcome />

<Header settings={data.settings} faded={headerFaded} />

<main >
	{@render children()}
</main>

<PrismicPreview {repositoryName} /> 
