<script lang="ts">
  import { PrismicImage } from '@prismicio/svelte';
  import { onDestroy } from 'svelte';

  interface Props {
    item: any;
    itemsPerRow?: string;
  }
  const { item, itemsPerRow }: Props = $props();

  const controlsTextClass = $derived((itemsPerRow ?? '1') === '1' ? 'h2' : ((itemsPerRow === '2') ? 'text-base' : 'text-sm'));

  let isActive = $state(false); // whether we swapped image->video
  let isPlaying = $state(false);
  let videoEl: HTMLVideoElement | null = $state(null);
  let hls: any = null;

  const onPlay = () => { isPlaying = true; };
  const onPause = () => { isPlaying = false; };

  async function handleToggle() {
    if (!item?.video_url || !item?.image?.url) return;

    if (!isActive) {
      // First click: swap to video and start playback
      isActive = true;
      // Wait next microtask to ensure <video> exists, then play
      queueMicrotask(async () => {
        if (!videoEl) return;
        try {
          // Listen for play/pause to update icon
          videoEl.addEventListener('play', onPlay);
          videoEl.addEventListener('pause', onPause);

          const url: string = item.video_url;
          const isNativeHls = !!videoEl.canPlayType && videoEl.canPlayType('application/vnd.apple.mpegurl');

          if (isNativeHls) {
            // Safari / iOS
            videoEl.src = url;
            await videoEl.play().catch(() => {});
          } else {
            // Try HLS.js lazily
            try {
              const HlsMod = await import('hls.js');
              const Hls = HlsMod.default ?? HlsMod;
              if (Hls && Hls.isSupported()) {
                if (hls) hls.destroy();
                hls = new Hls();
                hls.loadSource(url);
                hls.attachMedia(videoEl);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                  videoEl?.play().catch(() => {});
                });
              } else {
                // Fallback to direct src (mp4 or browsers with partial support)
                videoEl.src = url;
                await videoEl.play().catch(() => {});
              }
            } catch (e) {
              // hls.js not available, fallback to direct
              videoEl.src = url;
              await videoEl.play().catch(() => {});
            }
          }
        } catch (e) {
          // If autoplay fails, leave paused; user can tap once more
        }
      });
      return;
    }

    // Already active: toggle play/pause
    if (videoEl) {
      if (videoEl.paused) {
        videoEl.play().catch(() => {});
      } else {
        videoEl.pause();
      }
    }
  }

  onDestroy(() => {
    if (videoEl) {
      videoEl.removeEventListener('play', onPlay);
      videoEl.removeEventListener('pause', onPause);
    }
    if (hls) {
      try { hls.destroy(); } catch {}
      hls = null;
    }
  });
</script>

{#if item}
  {@const imageField = item.image}
  {@const videoUrl = item.video_url}

  {#if videoUrl && imageField?.url}
    <div class="relative brightness-[95%] select-none" on:click={handleToggle}>
      <!-- Keep the image in the document flow to preserve height -->
      <PrismicImage field={imageField} class="w-full h-auto rounded object-cover" />

      <!-- Overlay the video absolutely to avoid layout jump -->
      {#if isActive}
        <video
          bind:this={videoEl}
          class="absolute inset-0 w-full h-full rounded object-cover"
          poster={imageField.url}
          playsinline
          muted
          preload="none"
        />
      {/if}

      <!-- Play/Pause button, subtle rounded corners, bottom-right -->
      <div class="absolute bottom-1 right-1 rounded-lg p-2">
        {#if isActive && isPlaying}
          <!-- Pause icon -->
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
        {:else}
          <!-- Play icon -->
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        {/if}
      </div>
    </div>
  {/if}
{/if}

<style>
  /* Prevent long-press saving on iOS */
  video, img { -webkit-touch-callout: none; }
</style>

