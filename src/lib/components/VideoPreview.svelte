<script lang="ts">
	export let videoUrl: string;
	export let posterImage: any = null;
	export let aspectClass: string = 'aspect-video';
	export let additionalClasses: string = 'w-full h-auto rounded object-cover mb-4';
</script>

<video 
	controls 
	class="{additionalClasses} {aspectClass}"
	poster={posterImage?.url || ''}
>
	<source src={videoUrl} type="video/mp4">
	Your browser does not support the video tag.
</video>
