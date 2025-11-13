<script lang="ts">
  import { hoverPreview } from '$lib/stores/preview';
  import VideoPlayerSimple from '$lib/components/VideoPlayerSimple.svelte';
  import { onMount } from 'svelte';

  let mouseX = 0;
  let mouseY = 0;
  const offset = 16;
  const margin = 8;

  let playerWidth = 400; // square dimensions for circle
  let playerHeight = 400; // square dimensions for circle

  function handleMouseMove(e: MouseEvent) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  onMount(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  });

  $: viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  $: viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;

  $: targetX = Math.min(
    Math.max(mouseX + offset, margin),
    Math.max(margin, viewportWidth - playerWidth - margin - 15)
  );
  $: targetY = Math.min(
    Math.max(mouseY + offset, margin),
    Math.max(margin, viewportHeight - playerHeight - margin)
  );
</script>

{#if $hoverPreview?.url}
  <div
    class="fixed z-[120] pointer-events-none w-[400px] h-[400px] rounded-full overflow-hidden"
    style="left:0; top:0; transform: translate3d({targetX}px, {targetY}px, 0);"
  >
    <VideoPlayerSimple
      hlsUrl={$hoverPreview.url}
      posterImage={$hoverPreview.poster}
      classes="w-[400px] h-[400px] rounded-full overflow-hidden"
    />
  </div>
{/if}


