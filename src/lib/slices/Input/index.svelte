<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import BigWheel from '../../components/BigWheel.svelte';

	type Props = SliceComponentProps<Content.InputSlice>;

	const { slice }: Props = $props();

	let wheelText = $state<string>('Type your text here…');

	const wheelConfig = $derived({
		uiVisible: false,
		items: [
			{
				text: wheelText,
				rotationSpeed: 0.2,
				spacingAmplitudePercent: 2,
				spacingSpeed: 0,
				rotationStart: 0,
				animationType: 'sin',
				autoTextSize: true
			}
		],
		globalSettings: {
			containerSizePercent: 100,
			fontSizePercent: 9,
			distancePercent: 0,
			paused: false,
			textColor: '#000000',
			transparentBackground: true,
			manualMode: true,
			fadeInTime: 0,
			fadeOutTime: 0
		}
	});
</script>

<section class="pt-32 pb-32" data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	<div class="flex justify-center items-center w-full">
		<BigWheel config={wheelConfig} />
	</div>

	<div class="flex justify-center items-center w-full">
		<input
			id="wheel-text-input"
			type="text"
			placeholder="Type text for the circle..."
			bind:value={wheelText}
			class="p-3 border-b border-black w-1/2 mt-12 text-xl outline-none focus:outline-none focus:ring-0 focus:border-black"
		/>
	</div>
</section>
