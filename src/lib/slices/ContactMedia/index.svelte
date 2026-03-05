<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import VideoPlayerSimple from '$lib/components/VideoPlayerSimple.svelte';

	type Props = SliceComponentProps<Content.ContactMediaSlice>;

	const { slice }: Props = $props();

	const videoUrl = $derived((slice.primary as { video_url?: string | null }).video_url?.trim() ?? '');
	const imageField = $derived((slice.primary as { image?: { url?: string } }).image);

	const videoPanelClass =
		'bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0';
	const rightPanelClass =
		'bg-white rounded-lg shrink-0 min-w-0 aspect-square';
</script>

<section
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	class="w-full mb-2"
>
	<!-- Grid: 2/3 video + 1/3 square. aspect-[3/1] makes height = width/3 so square is 1:1 and video matches height -->
	<div class="flex flex-col md:grid md:grid-cols-[2fr_1fr] md:aspect-[3/1] gap-2 md:gap-2 w-full">
		<!-- Left: Video (2/3 width) - same height as square -->
		{#if videoUrl}
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

		<!-- Right: Empty square (1/3 width) -->
		<div class="{rightPanelClass} w-full aspect-square md:aspect-auto min-h-0">
		</div>
	</div>
</section>
