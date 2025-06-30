<script lang="ts">
	export let videoUrl: string;
	export let hlsUrl: string = '';
	export let posterImage: any = null;
	export let aspectClass: string = 'aspect-video';
	export let additionalClasses: string = 'w-full h-auto rounded object-cover mb-4';
	
	// Determine if we should use HLS or MP4
	$: useHls = hlsUrl && hlsUrl.includes('.m3u8');
</script>

<video 
	controls 
	class="{additionalClasses} {aspectClass}"
	poster={posterImage?.url || ''}
	preload="metadata"
>
	{#if useHls}
		<source src={hlsUrl} type="application/x-mpegURL">
		<source src={videoUrl} type="video/mp4">
	{:else}
		<source src={videoUrl} type="video/mp4">
	{/if}
	Your browser does not support the video tag.
</video>
