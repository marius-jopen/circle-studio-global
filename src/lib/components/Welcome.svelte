<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import BigWheel from './BigWheel.svelte';

  let showWelcome = true; // Start with welcome screen visible
  let isVisible = true;
  let backgroundVisible = true;
  let wheelVisible = true; // Start with wheel visible
  let welcomeElement: HTMLDivElement;
  let fadePhase: 'initial' | 'lettersVisible' | 'lettersFadingOut' | 'backgroundFadingOut' | 'hidden' = 'lettersVisible';

  // Check if we're on the home page
  $: isHomePage = page?.route?.id === '/[[preview=preview]]';

  // Check if we're on a project page and get project title
  $: isProjectPage = page?.route?.id?.includes('/work/[uid]');
  $: projectTitle = isProjectPage ? (page?.data?.project?.data?.title || page?.data?.title || 'Project') : '';
  $: projectClient = isProjectPage ? (page?.data?.project?.data?.client || 'Client') : '';
  $: projectDate = isProjectPage ? (page?.data?.project?.data?.date || '') : '';
  
  // Normal pages configuration
  $: normalPageConfig = {
    uiVisible: false,
    items: [
      {
        text: 'CIRCLE STUDIO GLOBAL',
        rotationSpeed: 0.3,
        spacingAmplitudePercent: 0,
        spacingSpeed: 0,
        rotationStart: 0,
        animationType: 'linear'
      }
    ],
    globalSettings: {
      containerSizePercent: 120,
      fontSizePercent: 15.7,
      distancePercent: 0,
      paused: false,
      textColor: isHomePage ? '#ffffff' : '#000000',
      backgroundColor: '#ffffff',
      transparentBackground: true,
      fadeInTime: 0,
      fadeOutTime: 1.2,
      pauseTime: 0,
      visibleTime: 0,
      manualMode: true,
      triggerFadeIn: false,
      triggerFadeOut: false
    }
  };
  
  // Project pages configuration
  $: projectPageConfig = {
    uiVisible: false,
    items: [
      {
        text: 'CIRCLE STUDIO GLOBAL',
        rotationSpeed: 0.5,
        spacingAmplitudePercent: 2,
        spacingSpeed: 0.09,
        rotationStart: 0,
        animationType: 'sin'
      },
      {
        text: projectTitle,
        rotationSpeed: 0.3,
        spacingAmplitudePercent: 2,
        spacingSpeed: 0.09,
        rotationStart: 180,
        animationType: 'sin'
      },
      {
        text: projectClient,
        rotationSpeed: 0.6,
        spacingAmplitudePercent: 2,
        spacingSpeed: 0.05,
        rotationStart: 80,
        animationType: 'sin'
      },
      {
        text: projectDate,
        rotationSpeed: 0.4,
        spacingAmplitudePercent: 2,
        spacingSpeed: 0.11,
        rotationStart: 250,
        animationType: 'sin'
      }
    ],
    globalSettings: {
      containerSizePercent: 100,
      fontSizePercent: 9,
      distancePercent: 1,
      paused: false,
      textColor: '#000000',
      backgroundColor: '#ffffff',
      transparentBackground: true,
      fadeInTime: 0.5,
      fadeOutTime: 1.2,
      pauseTime: 1.5,
      visibleTime: 5,
      manualMode: true,
      triggerFadeIn: false,
      triggerFadeOut: false
    }
  };
  
  // Choose which configuration to use
  $: welcomeConfig = isProjectPage ? projectPageConfig : normalPageConfig;
  
  // Debug logging for project page detection
  $: if (isProjectPage) {
    console.log('🎬 Welcome on project page - Using project configuration');
    console.log('🎬 Project data:', { projectTitle, projectClient, projectDate });
  }

  onMount(() => {
    if (!browser) return;

    console.log('🎭 Welcome component mounted on:', page?.route?.id, 'isHomePage:', isHomePage);

    // Check if this is navigation between pages (not a fresh load)
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const isNavigating = sessionStorage.getItem('circle-studio-navigating');
    
    console.log('🔍 Navigation check - isNavigating:', isNavigating, 'entry type:', navigationEntry?.type);
    
    // Hide welcome screen if this is navigation between pages
    if (isNavigating && navigationEntry?.type !== 'reload') {
      console.log('✅ This is navigation, hiding welcome screen');
      showWelcome = false;
      wheelVisible = false;
      fadePhase = 'hidden';
    } else {
      console.log('🆕 This is a fresh load, showing welcome screen');
      // This is a fresh load/reload - clear the navigation flag
      sessionStorage.removeItem('circle-studio-navigating');
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

    // Handle scroll dismissal (only on non-project pages)
    function handleScroll() {
      // Only allow scroll dismissal if:
      // 1. We're not on a project page
      // 2. Welcome screen is visible and ready to be dismissed
      if (!isProjectPage && fadePhase === 'lettersVisible') {
        console.log('📜 Scroll detected on non-project page, dismissing welcome screen');
        fadeOut();
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick);
    
    // Add scroll listener for non-project pages
    if (!isProjectPage) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      // Also listen for wheel events to catch scroll attempts even when page can't scroll
      window.addEventListener('wheel', handleScroll, { passive: true });
    }

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
      }, 800); // Match the CSS transition duration for background
    }, 1500); // Wait for letters to fade out (fadeOutTime)
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
  <div 
    class="welcome-overlay"
    class:background-visible={backgroundVisible}
    class:home-page={isHomePage}
    bind:this={welcomeElement}
    on:click={handleClick}
    on:keydown={handleKeydown}
    role="button"
    tabindex="0"
    aria-label="Click to continue to website"
  >
    <div class="welcome-content">
      <div class="wheel-container">
        {#if wheelVisible}
          <BigWheel config={welcomeConfig} />
        {/if}
      </div>
      
      <!-- Fixed positioned click hint to prevent layout jumps - only show on project pages -->
      {#if isProjectPage}
        <div class="click-hint" class:visible={fadePhase === 'lettersVisible'}>
          Click anywhere to continue
        </div>
      {/if}
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
    background-color: #ffffff; /* White background for other pages */
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    cursor: pointer;
    opacity: 1; /* Always start visible */
    transition: opacity 0.8s ease-in-out;
  }

  .welcome-overlay:not(.background-visible) {
    opacity: 0;
  }

  /* Transparent background for home page */
  .welcome-overlay.home-page {
    background-color: transparent;
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
    /* Container for the wheel - visible immediately */
  }

  .click-hint {
    position: absolute;
    bottom: 4rem;
    left: 50%;
    transform: translateX(-50%);
    color: #666; /* Gray text for other pages */
    font-size: 0.875rem;
    text-align: center;
    opacity: 0;
    font-family: system-ui, -apple-system, sans-serif;
    transition: opacity 0.5s ease-in-out;
    white-space: nowrap;
  }

  /* White click hint text for home page */
  .welcome-overlay.home-page .click-hint {
    color: #ffffff;
  }

  .click-hint.visible {
    opacity: 0.7;
  }

  /* Ensure the welcome screen works on mobile */
  @media (max-width: 768px) {
    .welcome-content {
      padding: 1rem;
    }
    
    .click-hint {
      font-size: 0.75rem;
      bottom: 2rem; /* Closer to bottom on mobile */
    }
  }
</style> 