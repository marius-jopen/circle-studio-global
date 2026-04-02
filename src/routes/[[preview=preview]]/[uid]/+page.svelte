<script lang="ts">
	import { SliceZone } from '@prismicio/svelte';
	import type { PageProps } from './$types';
	import Logo from '$lib/components/Logo.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	import { components } from '$lib/slices';

	const { data }: PageProps = $props();
	const isAbout = $derived(data?.page?.uid === 'about');

	// Scroll-bound rotation for about mobile logo
	let scrollRotation = $state(0);
	let targetRotation = $state(0);
	let lastScrollY = 0;
	let lastScrollTime = 0;
	let animFrame: number;

	function animateScroll() {
		const diff = targetRotation - scrollRotation;
		scrollRotation += diff * 0.12;
		animFrame = requestAnimationFrame(animateScroll);
	}

	onMount(() => {
		if (!isAbout) return;
		animateScroll();
		const handleScroll = () => {
			const now = performance.now();
			const scrollY = window.scrollY;
			const deltaY = scrollY - lastScrollY;
			const deltaTime = now - lastScrollTime;
			if (Math.abs(deltaY) > 0.5 && deltaTime > 0) {
				const velocity = deltaY / deltaTime;
				targetRotation += velocity * 0.4 * 12;
				lastScrollY = scrollY;
				lastScrollTime = now;
			}
		};
		let ticking = false;
		const throttled = () => {
			if (!ticking) {
				requestAnimationFrame(() => { handleScroll(); ticking = false; });
				ticking = true;
			}
		};
		window.addEventListener('scroll', throttled, { passive: true });
		return () => {
			window.removeEventListener('scroll', throttled);
			cancelAnimationFrame(animFrame);
		};
	});

	function handleLogoClick(e: MouseEvent) {
		e.preventDefault();
		try {
			localStorage.setItem('indexViewMode', 'grid');
			sessionStorage.setItem('circle-studio-navigating', 'true');
		} catch {}
		goto('/?view=grid');
	}
</script>

{#if isAbout}
	<a
		href="/"
		class="md:hidden fixed top-2 left-2 z-50 p-0"
		onclick={handleLogoClick}
		style="transform: rotate({scrollRotation}deg); will-change: transform;"
	>
		<Logo variant="black" rotationSpeed={0} size={75} />
	</a>
{/if}

<div class="px-2 {isAbout ? 'bg-neutral-100 min-h-screen' : ''}">
	{#if data?.page?.data?.slices}
		<SliceZone slices={data.page.data.slices} {components} />
	{/if}
</div>
