<script lang="ts">
	import { PrismicPreview } from '@prismicio/svelte/kit';
	import { page } from '$app/state';
	import { repositoryName } from '$lib/prismicio';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Intro from '$lib/components/Intro.svelte';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import "../app.css";
	import MobileNav from '$lib/components/MobileNav.svelte';
	let { children, data } = $props();
	
	// Check if we're on admin or login routes
	let isAdminRoute = $derived(page.url.pathname.startsWith('/admin') || page.url.pathname === '/login');
	
	// Global navigation click detection for video autoplay permissions
	let headerFaded = $state(false);
	let mainMediaVisible = $state(true);
	let videoIsDark = $state(false);
	let soundContexts = new Map<string, Set<string>>();
	let controlsVisibleContexts = new Map<string, Set<string>>();

	let io: IntersectionObserver | undefined;
	let observedEl: HTMLElement | null = null;

	function attachObserver() {
		const mainEl = document.getElementById('main-media');
		if (observedEl === mainEl) return;
		if (io && observedEl) io.unobserve(observedEl);
		observedEl = mainEl;
		if (mainEl && 'IntersectionObserver' in window) {
			io = new IntersectionObserver((entries) => {
				const entry = entries[0];
				mainMediaVisible = entry.isIntersecting && entry.intersectionRatio > 0;
				// Defer calling updateHeaderState until it's defined in onMount
			}, { threshold: [0, 0.01, 0.1] });
			io.observe(mainEl);
		} else {
			mainMediaVisible = false;
			// Defer calling updateHeaderState until it's defined in onMount
		}
	}

	onMount(() => {
		// Skip all main website logic if we're on admin/login routes
		if (isAdminRoute) {
			return;
		}
		
		const handleNavigationClick = (e: Event) => {
			const target = e.target as HTMLElement;
			// Ignore clicks coming from video components/controls
			if (target.closest('[data-video-interactive="true"]') || target.closest('[data-video-control="true"]')) {
				return;
			}
			if (target.closest('a') || target.closest('button')) {
				sessionStorage.setItem('circle-studio-navigating', 'true');
				sessionStorage.setItem('user-has-interacted', 'true');
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

		const handleProjectVideoDarkMode = (e: Event) => {
			const { isDark } = (e as CustomEvent).detail || {};
			videoIsDark = isDark;
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
		window.addEventListener('header-hover-on', updateHeaderState as EventListener);
		window.addEventListener('header-hover-off', updateHeaderState as EventListener);
		window.addEventListener('project-video-dark-mode', handleProjectVideoDarkMode as EventListener);
		
		// Observe main media visibility (initial)
		attachObserver();
		// Also try again after a delay to ensure DOM is ready
		setTimeout(() => {
			attachObserver();
		}, 500);
		// Now that updateHeaderState exists, trigger initial compute
		updateHeaderState();

		// Re-attach on route changes and reset per-page context
		afterNavigate(({ to }) => {
			// Scroll to top when navigating to project pages (from related projects or index)
			if (to?.route?.id?.includes('/work/[uid]')) {
				// Use multiple methods to ensure it works on all devices, especially mobile
				window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
				document.documentElement.scrollTop = 0;
				document.body.scrollTop = 0;
				// Also try with a small delay to handle async rendering
				setTimeout(() => {
					window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
					document.documentElement.scrollTop = 0;
					document.body.scrollTop = 0;
				}, 0);
			}
			
			// Clear only 'main' context states on navigation
			controlsVisibleContexts.delete('main');
			soundContexts.delete('main');
			mainMediaVisible = true;
			videoIsDark = false; // Reset video dark mode on navigation
			attachObserver();
			// Also try again after a delay to ensure DOM is ready
			setTimeout(() => {
				attachObserver();
			}, 500);
			updateHeaderState();
		});
		
		return () => {
			document.removeEventListener('click', handleNavigationClick);
			window.removeEventListener('video-playing-with-sound', handleVideoSoundOn as EventListener);
			window.removeEventListener('video-sound-off', handleVideoSoundOff as EventListener);
			window.removeEventListener('video-controls-shown', handleControlsShown as EventListener);
			window.removeEventListener('video-controls-hidden', handleControlsHidden as EventListener);
			if (io && observedEl) io.unobserve(observedEl);
			window.removeEventListener('header-hover-on', updateHeaderState as EventListener);
			window.removeEventListener('header-hover-off', updateHeaderState as EventListener);
			window.removeEventListener('project-video-dark-mode', handleProjectVideoDarkMode as EventListener);
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

{#if isAdminRoute}
	{@render children()}
{:else}
	<div class="min-h-screen flex flex-col">
		<Intro />
		<MobileNav />
		<Header settings={data.settings} faded={headerFaded} videoIsDark={videoIsDark} mainMediaVisible={mainMediaVisible} />

		<main class="flex-1">
			{@render children()}
		</main>

		{#if !(page?.data?.page?.data?.no_footer ?? false)}
			<Footer settings={data.settings} />
		{/if}
	</div>

	<PrismicPreview {repositoryName} />
{/if} 
