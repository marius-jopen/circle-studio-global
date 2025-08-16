<script lang="ts">
	// API required by assignment
	export let items: string[] = [];
export let urls: (string | null | undefined)[] | undefined = undefined; // optional parallel hrefs
	export let radius: number = 200; // px
	export let rotationSpeed: number = 20; // seconds per full rotation
	export let fontSize: number = 20; // optional text size

	$: size = radius * 2;
	$: count = Math.max(items.length, 1);
	const angleFor = (i: number) => (i / count) * 360;
</script>

<div class="w-full h-full grid place-items-center">
	<div class="relative" style={`width:${size}px;height:${size}px`}>
		<!-- Rotor spinning the entire circle -->
		<div class="absolute inset-0 animate-spin" style={`animation-duration:${rotationSpeed}s`}>
			{#each items as label, i}
				<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
					{#if urls && urls[i]}
						<a
							href={urls[i] as string}
							target="_blank"
							rel="noopener noreferrer"
							class="block whitespace-nowrap select-none"
							style={`transform: rotate(${angleFor(i)}deg) translateY(-${radius}px) rotate(90deg); transform-origin:50% 50%; font-size:${fontSize}px;`}
						>{label}</a>
					{:else}
						<span
							class="block whitespace-nowrap select-none pointer-events-none"
							style={`transform: rotate(${angleFor(i)}deg) translateY(-${radius}px) rotate(90deg); transform-origin:50% 50%; font-size:${fontSize}px;`}
						>{label}</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
/* No additional styles required; layout done via transforms and Tailwind classes */
</style>