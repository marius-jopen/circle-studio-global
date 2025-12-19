<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import Logo from './Logo.svelte';
  import BigWheel from './BigWheel.svelte';

  // Check if we're on a project page
  const isProjectPage = $derived(page?.route?.id?.includes('/work/[uid]'));
  
  // Get project data for the wheel
  const projectTitle = $derived(isProjectPage ? (page?.data?.project?.data?.title || 'Project') : '');
  const projectClient = $derived(isProjectPage ? (page?.data?.project?.data?.client || '') : '');
  
  function formatDateToMonthDotDayDotYear(value: string): string {
    if (!value) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (m) {
      const [, y, mm, dd] = m;
      return `${mm}.${dd}.${y}`;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const y = String(d.getFullYear());
    return `${mm}.${dd}.${y}`;
  }
  
  const projectDate = $derived(isProjectPage ? formatDateToMonthDotDayDotYear(page?.data?.project?.data?.date || '') : '');

  // Project wheel configuration
  const projectWheelConfig = $derived({
    uiVisible: false,
    items: [
      {
        text: 'ART CAMP EST.2016',
        rotationSpeed: 0.5,
        spacingAmplitudePercent: 2,
        spacingSpeed: 0.09,
        rotationStart: 0,
        animationType: 'sin'
      },
      {
        text: projectTitle || 'Project',
        rotationSpeed: 0.3,
        spacingAmplitudePercent: 2,
        spacingSpeed: 0.09,
        rotationStart: 180,
        animationType: 'sin'
      },
      {
        text: projectClient || 'Client',
        rotationSpeed: 0.6,
        spacingAmplitudePercent: 2,
        spacingSpeed: 0.05,
        rotationStart: 80,
        animationType: 'sin'
      },
      {
        text: projectDate || '',
        rotationSpeed: 0.4,
        spacingAmplitudePercent: 2,
        spacingSpeed: 0.11,
        rotationStart: 250,
        animationType: 'sin'
      }
    ],
    globalSettings: {
      containerSizePercent: 100,
      fontSizePercent: 7,
      distancePercent: 0.8,
      paused: false,
      textColor: '#ffffff',
      backgroundColor: '#000000',
      transparentBackground: true,
      fadeInTime: 0.5,
      fadeOutTime: 1.2,
      pauseTime: 0,
      visibleTime: 0,
      manualMode: true,
      triggerFadeIn: false,
      triggerFadeOut: false
    }
  });

// State - start visible on the server to avoid a flash of content
// before the intro mounts; client navigation still starts hidden.
const initialServerShow = !browser;
let showIntro = $state(initialServerShow);
let backgroundVisible = $state(initialServerShow);
let contentVisible = $state(initialServerShow);
  let introElement: HTMLDivElement;
  let fadePhase = $state<'hidden' | 'visible' | 'fadingOut'>(initialServerShow ? 'visible' : 'hidden');
  const initialWindowWidth = browser ? window.innerWidth : 1200;
  let windowWidth = $state(initialWindowWidth);
  
  // Logo size based on screen size (match MobileWheel on mobile)
  const logoSize = $derived(windowWidth < 768 ? Math.min(windowWidth * 0.9, 500) : 550);

  // Lock/unlock body scroll
  let scrollbarWidth = 0;
  let scrollY = 0;

  function lockScroll() {
    scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.documentElement.style.overflowY = 'scroll';
  }

  function unlockScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.documentElement.style.overflowY = '';
    window.scrollTo(0, scrollY);
  }

  onMount(() => {
    if (!browser) return;

    // Track width for responsive logo size on mobile
    const updateWidth = () => {
      windowWidth = window.innerWidth;
    };
    updateWidth();
    window.addEventListener('resize', updateWidth, { passive: true });

    // Pre-compute scrollbar width so locking scroll does not shift layout
    scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);

    // Detect if this is a hard reload using performance API
    const navigationEntries = performance.getEntriesByType('navigation');
    const navEntry = navigationEntries[0] as PerformanceNavigationTiming | undefined;
    const isHardReload = navEntry?.type === 'reload';
    
    // Check if intro was already seen in this session
    const introSeen = sessionStorage.getItem('circle-studio-intro-seen');
    
    // Clear the flag on hard reload so intro shows again
    if (isHardReload) {
      sessionStorage.removeItem('circle-studio-intro-seen');
    }
    
    // Show intro only if: it's a hard reload OR intro hasn't been seen yet
    const shouldShow = isHardReload || !introSeen;

    if (!shouldShow) {
      // Immediately hide if we already know not to show it
      showIntro = false;
      backgroundVisible = false;
      contentVisible = false;
      fadePhase = 'hidden';
      unlockScroll();
      return;
    }

    // Ensure overlay is visible as soon as we hit the client
    showIntro = true;
    backgroundVisible = true;
    contentVisible = true;
    fadePhase = 'visible';
    lockScroll();
    
    // Auto-dismiss after delay
    const autoDismissDelay = isProjectPage ? 10000 : 2000;
    setTimeout(() => {
      if (fadePhase === 'visible') {
        fadeOut();
      }
    }, autoDismissDelay);

    // Handle scroll dismissal (only for non-project pages)
    function handleScroll() {
      if (!isProjectPage && fadePhase === 'visible') {
        fadeOut();
      }
    }

    if (!isProjectPage) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('wheel', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleScroll);
      unlockScroll();
    };
  });

  function fadeOut() {
    if (fadePhase !== 'visible') return;
    
    fadePhase = 'fadingOut';
    unlockScroll();
    
    // Mark intro as seen for this session
    if (browser) {
      sessionStorage.setItem('circle-studio-intro-seen', 'true');
      sessionStorage.setItem('user-has-interacted', 'true');
    }
    
    // Dispatch event for other components
    if (browser) {
      window.dispatchEvent(new CustomEvent('welcome-dismissed'));
    }
    
    // Fade out
    contentVisible = false;
    backgroundVisible = false;
    
    // Remove component after animation
    setTimeout(() => {
      showIntro = false;
      fadePhase = 'hidden';
    }, 800);
  }

  function handleClick() {
    if (fadePhase === 'visible') {
      fadeOut();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if ((event.key === 'Enter' || event.key === ' ') && fadePhase === 'visible') {
      fadeOut();
    }
  }
</script>

{#if showIntro}
  <div 
    class="intro-overlay cursor-pointer z-30"
    class:background-visible={backgroundVisible}
    bind:this={introElement}
    onclick={handleClick}
    onkeydown={handleKeydown}
    role="button"
    tabindex="0"
    aria-label="Click to continue to website"
  >
    <div class="intro-content cursor-pointer z-30">
      {#if isProjectPage}
        <!-- Project page: Show BigWheel -->
        <div class="wheel-container" class:content-visible={contentVisible}>
          <BigWheel config={projectWheelConfig} />
        </div>
      {:else}
        <!-- Other pages: Show Logo -->
        <div class="logo-container" class:content-visible={contentVisible}>
          <Logo variant="white" rotationSpeed={10} size={logoSize} />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .intro-overlay {
    position: fixed;
    top: -15%;
    left: -15%;
    right: -15%;
    bottom: -15%;
    width: 130vw;
    height: 130vh;
    height: 130dvh;
    background-color: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20000;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.8s ease-in-out;
    touch-action: none;
    overscroll-behavior: none;
    -webkit-overflow-scrolling: none;
    pointer-events: none;
  }

  .intro-overlay.background-visible {
    opacity: 1;
    pointer-events: auto;
  }

  .intro-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    height: 100%;
  }

  .logo-container,
  .wheel-container {
    position: relative;
    z-index: 1;
    opacity: 0;
    transition: opacity 0.8s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-container.content-visible,
  .wheel-container.content-visible {
    opacity: 1;
  }

  /* Mobile scaling for wheel */
  @media (max-width: 768px) {
    .wheel-container {
      transform: scale(0.4);
    }
  }
</style>
