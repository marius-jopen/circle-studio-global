<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import VideoPlayerSimple from '$lib/components/VideoPlayerSimple.svelte';

	type Props = SliceComponentProps<Content.VideoAutoplaySlice>;

	const { slice }: Props = $props();

	const videoUrl = $derived((slice.primary as { video_url?: string | null }).video_url?.trim() ?? '');
	const posterImage = $derived((slice.primary as { image?: { url?: string } }).image);
</script>

<section
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	class="w-full mb-2 aspect-video overflow-hidden"
>
	{#if videoUrl}
		<VideoPlayerSimple
			hlsUrl={videoUrl}
			posterImage={posterImage}
			classes="w-full h-full object-cover"
			dimension="landscape"
			itemsPerRow={1}
			containerSizePercent={100}
			enableOnMobile={true}
		/>
	{/if}
</section>
