<script lang="ts">
  import { PrismicImage } from '@prismicio/svelte';
  import { onDestroy } from 'svelte';

  interface Props {
    item: any;
    itemsPerRow?: string;
    noRoundedCorners?: boolean;
  }
  const { item, itemsPerRow, noRoundedCorners = false }: Props = $props();

  const controlsTextClass = $derived((itemsPerRow ?? '1') === '1' ? 'h2' : ((itemsPerRow === '2') ? 'text-base' : 'text-sm'));
  const roundedClass = $derived(noRoundedCorners ? '' : 'rounded');

  let isActive = $state(false); // whether we swapped image->video
  let isPlaying = $state(false);
  let isVideoReady = $state(false); // first frame ready, safe to reveal
  let videoEl: HTMLVideoElement | null = $state(null);
  let hls: any = null;
  let rootEl: HTMLElement | null = $state(null);
  let isInView = $state(false);
  let io: IntersectionObserver | null = null;

  const onPlay = () => { isPlaying = true; };
  const onPause = () => { isPlaying = false; };

  function handleKey(event: KeyboardEvent) {}

  function deactivateVideo() {
    if (videoEl) {
      try { videoEl.pause(); } catch {}
      videoEl.removeEventListener('play', onPlay);
      videoEl.removeEventListener('pause', onPause);
      videoEl.removeEventListener('loadedmetadata', onLoadedMetadata);
      videoEl.removeEventListener('loadeddata', onFirstFrameReady);
      videoEl.removeEventListener('canplay', onFirstFrameReady);
    }
    if (hls) {
      try { hls.destroy(); } catch {}
      hls = null;
    }
    isPlaying = false;
    isActive = false;
    isVideoReady = false;
  }

  const onLoadedMetadata = () => {
    if (!videoEl) return;
    try { videoEl.currentTime = 0; } catch {}
  };

  const onFirstFrameReady = () => {
    if (!videoEl) return;
    const anyVideo: any = videoEl;
    if (typeof anyVideo.requestVideoFrameCallback === 'function') {
      anyVideo.requestVideoFrameCallback(() => { isVideoReady = true; });
    } else {
      isVideoReady = true;
    }
  };

  async function activateVideo() {
    if (!item?.video_url || !item?.image?.url) return;
    if (isActive) return;
    isActive = true;
    isVideoReady = false;
    queueMicrotask(async () => {
      if (!videoEl) return;
      try {
        videoEl.addEventListener('play', onPlay);
        videoEl.addEventListener('pause', onPause);
        videoEl.addEventListener('loadedmetadata', onLoadedMetadata, { once: true } as any);
        videoEl.addEventListener('loadeddata', onFirstFrameReady, { once: true } as any);
        videoEl.addEventListener('canplay', onFirstFrameReady, { once: true } as any);

        const url: string = item.video_url;
        const isNativeHls = !!videoEl.canPlayType && videoEl.canPlayType('application/vnd.apple.mpegurl');

        if (isNativeHls) {
          videoEl.src = url;
          await videoEl.play().catch(() => {});
        } else {
          try {
            const HlsMod = await import('hls.js');
            const Hls = HlsMod.default ?? HlsMod;
            if (Hls && Hls.isSupported()) {
              if (hls) hls.destroy();
              hls = new Hls();
              hls.loadSource(url);
              hls.attachMedia(videoEl);
              hls.on(Hls.Events.MANIFEST_PARSED, () => { videoEl?.play().catch(() => {}); });
            } else {
              videoEl.src = url;
              await videoEl.play().catch(() => {});
            }
          } catch (e) {
            videoEl.src = url;
            await videoEl.play().catch(() => {});
          }
        }
      } catch (e) {}
    });
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
    if (io) { try { io.disconnect(); } catch {} io = null; }
  });

  // IntersectionObserver to auto-activate when in view
  $effect(() => {
    if (!rootEl) return;
    if (io) return;
    io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        isInView = entry.isIntersecting || entry.intersectionRatio > 0.1;
      }
    }, { root: null, rootMargin: '0px 0px', threshold: 0.1 });
    io.observe(rootEl);
  });

  // Drive activation/deactivation based on visibility
  $effect(() => {
    if (!item?.video_url || !item?.image?.url) return;
    if (isInView) {
      activateVideo();
    } else {
      if (isActive) deactivateVideo();
    }
  });
</script>

{#if item}
  {@const imageField = item.image}
  {@const videoUrl = item.video_url}

  {#if videoUrl && imageField?.url}
    {@const imgW = imageField?.dimensions?.width}
    {@const imgH = imageField?.dimensions?.height}
    {@const isLandscape = !!imgW && !!imgH ? imgW > imgH : false}
  <div
      bind:this={rootEl}
      class={`relative select-none ${isLandscape ? 'aspect-square' : ''}`}
    >
      <!-- Keep the image in the document flow to preserve height -->
      <PrismicImage field={imageField} class={isLandscape ? `absolute inset-0 z-0 w-full h-full ${roundedClass} object-cover no-callout brightness-[95%]` : `w-full h-auto ${roundedClass} object-cover no-callout brightness-[95%]`} />

      <!-- Overlay the video absolutely to avoid layout jump -->
      {#if isActive}
        <video
          bind:this={videoEl}
          class={`absolute inset-0 z-10 w-full h-full ${roundedClass} object-cover no-callout ios-video-fix transition-opacity duration-200 ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}
          poster={imageField.url}
          playsinline
          muted
          loop
          preload="none"
        ></video>
      {/if}

      <!-- No manual controls on mobile: auto-play while in view -->
    </div>
  {/if}
{/if}

<style>
  /* Prevent long-press saving on iOS */
  .no-callout { -webkit-touch-callout: none; }
  /* Help iOS Safari composite the video correctly */
  .ios-video-fix { -webkit-transform: translateZ(0); transform: translateZ(0); backface-visibility: hidden; will-change: transform; }
</style>

