<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import FanWheel from '$lib/components/FanWheel.svelte';

	type Props = SliceComponentProps<Content.WheelSlice>;

	const { slice }: Props = $props();

	// Example data until wired to CMS
	let items: string[] = [
		'car',
		'house',
		'mouse',
		'tiger',
		'cheese',
		'bread',
		'train',
		'car',
		'house',
		'mouse',
		'tiger',
		'cheese',
		'bread',
		'train'
	];

	let speed = $state(12); // °/s
</script>

<section data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	<div class="container">
		<FanWheel {items}
			size={820}
			radius={300}
			startAngleDeg={-140}
			endAngleDeg={140}
			speedDegPerSec={speed}
			fontSize={26}
			showControls={false}
		/>
		<div class="controls">
			<label>
				<span>Speed</span>
				<input type="range" min="-90" max="90" step="1" bind:value={speed}>
				<output>{Math.round(speed)}°/s</output>
			</label>
		</div>
	</div>
</section>

<style>
	.container { display: grid; gap: 16px; justify-items: center; }
	.controls { display: flex; gap: 12px; align-items: center; }
	.controls label { display: inline-flex; gap: 8px; align-items: center; }
</style>
