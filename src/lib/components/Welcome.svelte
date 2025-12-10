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

  // Check if we're on the home page (runes)
  const isHomePage = $derived(page?.route?.id === '/[[preview=preview]]');

  // Check if we're on a project page (runes)
  const isProjectPage = $derived(page?.route?.id?.includes('/work/[uid]'));
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
  // Keep for potential future use
  // const projectDate = $derived(isProjectPage ? formatDateToMonthDotDayDotYear(page?.data?.project?.data?.date || '') : '');
  
  // Show welcome screen on initial page loads (home and project pages).
  // Subsequent internal navigations will skip it (handled in onMount below).
  
  // Normal pages configuration (runes)
  const normalPageConfig = $derived({
    uiVisible: false,
    items: [
      {
        text: 'ART CAMP EST.2016',
        rotationSpeed: 0.3,
        spacingAmplitudePercent: 0,
        spacingSpeed: 0,
        rotationStart: 0,
        animationType: 'linear'
      }
    ],
    globalSettings: {
      containerSizePercent: 120,
      fontSizePercent: 18,
      distancePercent: 0,
      paused: false,
      textColor: '#171717',
      backgroundColor: '#ffffff',
      transparentBackground: true,
      fadeInTime: 0,
      fadeOutTime: 1,
      pauseTime: 0,
      visibleTime: 0,
      manualMode: true,
      triggerFadeIn: false,
      triggerFadeOut: false
    }
  });
  
  // Removed project-specific welcome config; we always use the normal config
  
  // Always use normal page configuration for the welcome screen
  let welcomeConfig = $state(normalPageConfig);

  onMount(() => {
    if (!browser) return;

    console.log('🎭 Welcome component mounted on:', page?.route?.id, 'isHomePage:', isHomePage);

    // Check if this is navigation between pages (not a fresh load)
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const isNavigating = sessionStorage.getItem('circle-studio-navigating');
    
    console.log('🔍 Navigation check - isNavigating:', isNavigating, 'entry type:', navigationEntry?.type);
    
    // Hide welcome screen only if this is navigation between pages
    if (isNavigating && navigationEntry?.type !== 'reload') {
      console.log('✅ This is navigation between pages, hiding welcome screen');
      showWelcome = false;
      wheelVisible = false;
      fadePhase = 'hidden';
    } else {
      console.log('🆕 This is a fresh load, showing welcome screen');
      // This is a fresh load/reload - clear the navigation flag
      sessionStorage.removeItem('circle-studio-navigating');
      showWelcome = true;
      wheelVisible = true;
      fadePhase = 'lettersVisible';
      // Auto-dismiss after a short delay if no interaction
      setTimeout(() => {
        if (fadePhase === 'lettersVisible') {
          fadeOut();
        }
      }, 1000);
    }

    // Set navigation flag when user navigates away
    function handleBeforeUnload() {
      sessionStorage.setItem('circle-studio-navigating', 'true');
      console.log('🚪 Setting navigation flag on beforeunload');
    }

    function handleClick(event: Event) {
      const target = event.target as HTMLElement;
      if (target.tagName === 'A' || target.closest('a')) {
        sessionStorage.setItem('circle-studio-navigating', 'true');
        console.log('🔗 Setting navigation flag on link click');
        // Also set user interaction permission for video autoplay with sound
        sessionStorage.setItem('user-has-interacted', 'true');
        console.log('🖱️ Navigation click detected in Welcome, stored user interaction permission');
      }
    }

    // Handle scroll dismissal
    function handleScroll() {
      // Allow scroll to dismiss when visible
      if (fadePhase === 'lettersVisible') {
        console.log('📜 Scroll detected, dismissing welcome screen');
        fadeOut();
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick);
    
    // Add scroll listeners for all pages
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Also listen for wheel events to catch scroll attempts even when page can't scroll
    window.addEventListener('wheel', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleScroll);
    };
  });

  function fadeOut() {
    if (fadePhase !== 'lettersVisible') return;
    
    fadePhase = 'lettersFadingOut';
    
    // Store user interaction permission immediately
    if (browser) {
      sessionStorage.setItem('user-has-interacted', 'true');
      console.log('💾 Welcome dismissed - stored user interaction permission');
    }
    
    // Dispatch event to notify that user has interacted and welcome is being dismissed
    if (browser) {
      console.log('🎭 Welcome screen dismissed, dispatching event...');
      window.dispatchEvent(new CustomEvent('welcome-dismissed'));
    }
    
    // Trigger letters to fade out
    welcomeConfig.globalSettings.triggerFadeOut = true;
    welcomeConfig = { ...welcomeConfig };
    
    // Reset trigger after a moment
    setTimeout(() => {
      welcomeConfig.globalSettings.triggerFadeOut = false;
      welcomeConfig = { ...welcomeConfig };
    }, 100);
    
    // After letters fade out, start background fade
    setTimeout(() => {
      fadePhase = 'backgroundFadingOut';
      wheelVisible = false; // Hide wheel
      backgroundVisible = false;
      
      // Remove the component after background fade completes
      setTimeout(() => {
        showWelcome = false;
        fadePhase = 'hidden';
      }, 1200); // Match the CSS transition duration for background
    }, 1200); // Wait for letters to fade out (fadeOutTime)
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
       bind:this={welcomeElement}
       onclick={handleClick}
       onkeydown={handleKeydown}
       role="button"
       tabindex="0"
       aria-label="Click to continue to website">
    <div class="welcome-content cursor-pointer z-30">
      <div class="wheel-container cursor-pointer scale-50 md:scale-100">
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
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #ffffff; /* Always white background */
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20000; /* Above header and logo */
    cursor: pointer;
    opacity: 1; /* Always start visible */
    transition: opacity 0.8s ease-in-out;
  }

  .welcome-overlay:not(.background-visible) {
    opacity: 0;
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
  }
 

  /* Show on all viewports */
</style> 