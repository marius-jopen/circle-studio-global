<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import BigWheel from './BigWheel.svelte';

  let showWelcome = $state(true); // Show immediately on first load; hide on internal navigations
  let isVisible = $state(true);
  let backgroundVisible = $state(true);
  let wheelVisible = $state(true); // Start with wheel visible
  let welcomeElement: HTMLDivElement;
  let fadePhase = $state<'initial' | 'lettersVisible' | 'lettersFadingOut' | 'backgroundFadingOut' | 'hidden'>('lettersVisible');
  let darkMode = $state(true); // When true: black background, white text

  // Lock body scroll when welcome is visible
  function lockScroll() {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
  }

  function unlockScroll() {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.documentElement.style.overflow = '';
  }

  // Check if we're on the home page (runes)
  const isHomePage = $derived(page?.route?.id === '/[[preview=preview]]');

  // Check if we're on a project page (runes)
  const isProjectPage = $derived(page?.route?.id?.includes('/work/[uid]'));
  
  // Get project data
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
  
  // Project pages configuration with 4 items (4 rings)
  const projectPageConfig = $derived({
    uiVisible: false,
    items: [
      {
        // Outer ring (index 0 = outermost)
        text: 'ART CAMP EST.2016',
        rotationSpeed: 0.5,
        spacingAmplitudePercent: 2,
        spacingSpeed: 0.09,
        rotationStart: 0,
        animationType: 'sin'
      },
      {
        // Second ring
        text: projectTitle || 'Project',
        rotationSpeed: 0.3,
        spacingAmplitudePercent: 2,
        spacingSpeed: 0.09,
        rotationStart: 180,
        animationType: 'sin'
      },
      {
        // Third ring
        text: projectClient || 'Client',
        rotationSpeed: 0.6,
        spacingAmplitudePercent: 2,
        spacingSpeed: 0.05,
        rotationStart: 80,
        animationType: 'sin'
      },
      {
        // Most inner ring (index 3 = innermost)
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
  
  // Use project page configuration - create a mutable copy
  // We need state because we mutate triggerFadeOut in fadeOut()
  // Initialize with a copy of the derived config, and update reactively
  let welcomeConfig = $state({
    uiVisible: false,
    items: [],
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
  
  // Update config when project data changes - access derived inside effect
  $effect(() => {
    // Access the derived value to track changes
    const config = projectPageConfig;
    const newConfig = JSON.parse(JSON.stringify(config)); // Deep copy
    // Preserve triggerFadeOut state if we're in the middle of fading
    if (fadePhase === 'lettersFadingOut') {
      newConfig.globalSettings.triggerFadeOut = welcomeConfig.globalSettings.triggerFadeOut;
    }
    welcomeConfig = newConfig;
  });

  onMount(() => {
    if (!browser) return;

    // Check if this is navigation between pages (not a fresh load)
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const isNavigating = sessionStorage.getItem('circle-studio-navigating');
    
    // Hide welcome screen only if this is navigation between pages
    if (isNavigating && navigationEntry?.type !== 'reload') {
      showWelcome = false;
      wheelVisible = false;
      fadePhase = 'hidden';
    } else {
      // This is a fresh load/reload - clear the navigation flag
      sessionStorage.removeItem('circle-studio-navigating');
      showWelcome = true;
      wheelVisible = true;
      fadePhase = 'lettersVisible';
      // Lock scrolling while welcome is visible
      lockScroll();
      // Auto-dismiss after a longer delay if no interaction (10 seconds)
      setTimeout(() => {
        if (fadePhase === 'lettersVisible') {
          fadeOut();
        }
      }, 10000);
    }

    // Set navigation flag when user navigates away
    function handleBeforeUnload() {
      sessionStorage.setItem('circle-studio-navigating', 'true');
    }

    function handleClick(event: Event) {
      const target = event.target as HTMLElement;
      if (target.tagName === 'A' || target.closest('a')) {
        sessionStorage.setItem('circle-studio-navigating', 'true');
        // Also set user interaction permission for video autoplay with sound
        sessionStorage.setItem('user-has-interacted', 'true');
      }
    }

    // Handle scroll dismissal - disabled for project pages (only dismiss on click)
    // Scroll dismissal removed so welcome stays visible longer

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick);
    
    // Scroll listeners removed - welcome only dismisses on click or after timeout

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick);
      unlockScroll();
    };
  });

  function fadeOut() {
    if (fadePhase !== 'lettersVisible') return;
    
    fadePhase = 'lettersFadingOut';
    
    // Unlock scrolling when fading out
    unlockScroll();
    
    // Store user interaction permission immediately
    if (browser) {
      sessionStorage.setItem('user-has-interacted', 'true');
    }
    
    // Dispatch event to notify that user has interacted and welcome is being dismissed
    if (browser) {
      window.dispatchEvent(new CustomEvent('welcome-dismissed'));
    }
    
    // Don't trigger BigWheel's fade-out - let animation continue smoothly
    // Instead, just fade the overlay background
    fadePhase = 'backgroundFadingOut';
    backgroundVisible = false; // Fade out background but keep wheel animating
    
    // Remove the component after background fade completes
    // Keep wheel visible until the very end so animation doesn't stop abruptly
    setTimeout(() => {
      showWelcome = false;
      wheelVisible = false; // Only hide wheel when component is removed
      fadePhase = 'hidden';
    }, 800); // Match the CSS transition duration for background
  }

  function handleClick() {
    if (fadePhase === 'lettersVisible') {
      fadeOut();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if ((event.key === 'Enter' || event.key === ' ') && fadePhase === 'lettersVisible') {
      fadeOut();
    }
  }
</script>

{#if showWelcome}
  <div class="welcome-overlay cursor-pointer z-30"
       class:background-visible={backgroundVisible}
       class:dark-mode={darkMode}
       bind:this={welcomeElement}
       onclick={handleClick}
       onkeydown={handleKeydown}
       role="button"
       tabindex="0"
       aria-label="Click to continue to website">
    <div class="welcome-content cursor-pointer z-30">
      <div class="wheel-container cursor-pointer">
        {#if wheelVisible}
          <BigWheel config={welcomeConfig} />
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .welcome-overlay {
    position: fixed;
    /* Extend beyond viewport edges to cover Safari mobile dynamic UI */
    top: -15%;
    left: -15%;
    right: -15%;
    bottom: -15%;
    width: 130vw;
    height: 130vh; /* Fallback for older browsers */
    height: 130dvh; /* Dynamic viewport height - accounts for Safari mobile URL bar */
    background-color: #ffffff; /* Default white background */
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20000; /* Above header and logo */
    cursor: pointer;
    opacity: 1; /* Always start visible */
    transition: opacity 0.8s ease-in-out;
    /* Prevent any touch scrolling on the overlay */
    touch-action: none;
    overscroll-behavior: none;
    -webkit-overflow-scrolling: none;
  }

  .welcome-overlay.dark-mode {
    background-color: #000000; /* Black background when darkMode is true */
  }

  .welcome-overlay:not(.background-visible) {
    opacity: 0;
    pointer-events: none; /* Allow clicks to pass through when faded */
  }

  .welcome-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    height: 100%;
  }

  .wheel-container {
    position: relative;
    z-index: 1;
    /* Keep wheel visible and animating even when overlay fades */
    opacity: 1;
    transition: opacity 0.3s ease-in-out;
    /* Center the container */
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Mobile-specific: ensure perfect centering with scale transform */
  @media (max-width: 768px) {
    .wheel-container {
      transform-origin: center center !important;
      transform: scale(0.4);
    }
  }
  
  /* Desktop: reset transform for md and above */
  @media (min-width: 768px) {
    .wheel-container {
      transform: none;
    }
  }
  
  /* Ensure wheel continues animating during fade-out */
  .welcome-overlay:not(.background-visible) .wheel-container {
    opacity: 1; /* Keep wheel fully visible even when background fades */
  }
 

  /* Show on all viewports */
</style> 