<script lang="ts">
	// API required by assignment
	export let items: string[] = [];
	export let urls: (string | null | undefined)[] | undefined = undefined; // optional parallel hrefs
	export let radius: number = 50; // px
	export let rotationSpeed: number = 60; // seconds per full rotation
	export let fontSize: number = 20; // optional text size
    /**
     * Controls how generously the container is sized vertically.
     * - 'safe': guarantees no overflow during rotation by using text width
     * - 'tight': uses text height for top/bottom, reducing empty space (may clip during rotation)
     */
    export let fit: 'safe' | 'tight' = 'tight';
    // For testing denser wheels: repeat items N times around the circle
    export let repeat: number = 3;
	import { browser } from '$app/environment';

	$: size = radius * 2;
	$: repeatSafe = Math.max(1, Math.floor(repeat));
	$: renderItems = Array.from({ length: repeatSafe }, () => items).flat();
	$: renderUrls = urls ? (Array.from({ length: repeatSafe }, () => urls as (string | null | undefined)[]).flat()) : undefined;
	$: count = Math.max(renderItems.length, 1);
	const angleFor = (i: number) => (i / count) * 360;

	// Function to calculate text width for positioning
	function getTextWidth(text: string): number {
		if (!browser) {
			// SSR-safe rough estimate (character count × average width factor)
			return text.length * (fontSize * 0.6);
		}
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		if (context) {
			context.font = `${fontSize}px sans-serif`;
			return context.measureText(text).width;
		}
		return 0;
	}

	// Calculate the adjusted radius for right-aligned text
	function getAdjustedRadius(text: string): number {
		const textWidth = getTextWidth(text);
		// Add half the text width to move the right edge to the inner boundary
		return radius + (textWidth / 2);
	}

	// Compute the maximum text width to size the outer container
	$: maxTextWidth = Math.max(0, ...items.map((t) => getTextWidth(t)));
	// Outer size: width accounts for longest label; height configurable by `fit`
	$: outerWidth = 2 * (radius + maxTextWidth);
	$: outerHeight = 2 * (radius + (fit === 'safe' ? maxTextWidth : fontSize));
</script>

<div class="w-full h-full grid place-items-center py-20">
	<div class="relative" style={`width:${outerWidth}px;height:${outerHeight}px`}>
		<!-- Rotor spinning the entire circle -->
		<div class="absolute inset-0 animate-spin text-black wheel" style={`animation-duration:${rotationSpeed}s`}>
			{#each renderItems as label, i}
				<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
					{#if renderUrls && renderUrls[i]}
						<a
							href={renderUrls[i] as string}
							target="_blank"
							rel="noopener noreferrer"
							class="block whitespace-nowrap select-none transition-colors duration-200 hover:text-black"
							style={`transform: rotate(${angleFor(i)}deg) translateY(-${getAdjustedRadius(label)}px) rotate(90deg); transform-origin:50% 50%; font-size:${fontSize}px;`}
						>{label}</a>
					{:else}
						<span
							class="block whitespace-nowrap select-none transition-colors duration-200 hover:text-black"
							style={`transform: rotate(${angleFor(i)}deg) translateY(-${getAdjustedRadius(label)}px) rotate(90deg); transform-origin:50% 50%; font-size:${fontSize}px;`}
						>{label}</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
/* Layout is done via transforms and Tailwind classes */
.wheel:has(a:hover),
.wheel:has(span:hover) {
	color: rgb(163 163 163); /* tailwind neutral-400 */
}
.wheel a:hover,
.wheel span:hover {
	color: rgb(0 0 0); /* black */
}
</style>