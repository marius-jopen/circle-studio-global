<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import BigWheel from './BigWheel.svelte';

  let showWelcome = true; // Start with welcome screen visible
  let isVisible = true;
  let backgroundVisible = true;
  let wheelVisible = true; // Start with wheel visible
  let welcomeElement: HTMLDivElement;
  let fadePhase: 'initial' | 'lettersVisible' | 'lettersFadingOut' | 'backgroundFadingOut' | 'hidden' = 'lettersVisible';

  // Configuration for the BigWheel component
  let welcomeConfig = {
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
      textColor: '#000000',
      backgroundColor: '#ffffff',
      transparentBackground: true, // Let the overlay handle background
      fadeInTime: 0, // No fade in - visible immediately
      fadeOutTime: 1.2, // Letters fade out over 1.5 seconds when dismissing
      pauseTime: 0,
      visibleTime: 0, // Not used in manual mode
      manualMode: true, // Manual control of fade cycle
      triggerFadeIn: false,
      triggerFadeOut: false
    }
  };

  onMount(() => {
    if (!browser) return;

    // Check if this is navigation between pages (not a fresh load)
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const isNavigating = sessionStorage.getItem('circle-studio-navigating');
    
    // Hide welcome screen if this is navigation between pages
    if (isNavigating && navigationEntry?.type !== 'reload') {
      showWelcome = false;
      wheelVisible = false;
      fadePhase = 'hidden';
    } else {
      // This is a fresh load/reload - clear the navigation flag
      sessionStorage.removeItem('circle-studio-navigating');
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
        console.log('🖱️ Navigation click detected in Welcome, stored user interaction permission');
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick);
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
      
      <!-- Fixed positioned click hint to prevent layout jumps -->
      <div class="click-hint" class:visible={fadePhase === 'lettersVisible'}>
        Click anywhere to continue
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
    background-color: #ffffff;
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
    color: #666;
    font-size: 0.875rem;
    text-align: center;
    opacity: 0;
    font-family: system-ui, -apple-system, sans-serif;
    transition: opacity 0.5s ease-in-out;
    white-space: nowrap;
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