<script lang="ts">
	import { PrismicImage } from '@prismicio/svelte';
	import VideoPreview from './VideoPreview.svelte';

	export let item: any;
</script>

<div class="block brightness-[97%]">
	{#if item}
		{@const imageField = item.image}
		{@const videoUrl = item.video_url}
		
		{#if videoUrl}
			<div class="relative">
				<VideoPreview 
					hlsUrl={videoUrl}
					posterImage={imageField} 
					classes="w-full h-auto rounded object-cover"
				/>
			</div>
		{:else if imageField?.url}
			<div class="relative">
				<PrismicImage 
					field={imageField} 
					class="w-full h-auto rounded object-cover"
				/>
			</div>
		{/if}
	{/if}
</div> 