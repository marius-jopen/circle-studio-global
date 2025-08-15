<script lang="ts">
  import { hoverPreview } from '$lib/stores/preview';
  import VideoPlayerSimple from '$lib/components/VideoPlayerSimple.svelte';
</script>

{#if $hoverPreview?.url}
  <div class="fixed bottom-3 right-3 z-[120] pointer-events-none">
    <VideoPlayerSimple
      hlsUrl={$hoverPreview.url}
      posterImage={$hoverPreview.poster}
      classes="w-[360px] h-auto rounded-md shadow-lg"
    />
  </div>
{/if}


