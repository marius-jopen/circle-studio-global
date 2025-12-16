<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import Logo from './Logo.svelte';

  let showWelcome = $state(true); // Show immediately on first load; hide on internal navigations
  let backgroundVisible = $state(true);
  let logoVisible = $state(true);
  let welcomeElement: HTMLDivElement;
  let fadePhase = $state<'initial' | 'visible' | 'fadingOut' | 'hidden'>('visible');
  let darkMode = $state(true); // When true: black background, white logo

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

  onMount(() => {
    if (!browser) return;

    // Check if this is navigation between pages (not a fresh load)
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const isNavigating = sessionStorage.getItem('circle-studio-navigating');
    
    // Hide welcome screen only if this is navigation between pages
    if (isNavigating && navigationEntry?.type !== 'reload') {
      showWelcome = false;
      logoVisible = false;
      fadePhase = 'hidden';
    } else {
      // This is a fresh load/reload - clear the navigation flag
      sessionStorage.removeItem('circle-studio-navigating');
      showWelcome = true;
      logoVisible = true;
      fadePhase = 'visible';
      // Lock scrolling while welcome is visible
      lockScroll();
      // Auto-dismiss after a short delay if no interaction
      setTimeout(() => {
        if (fadePhase === 'visible') {
          fadeOut();
        }
      }, 2000);
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

    // Handle scroll dismissal
    function handleScroll() {
      // Allow scroll to dismiss when visible
      if (fadePhase === 'visible') {
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
      unlockScroll();
    };
  });

  function fadeOut() {
    if (fadePhase !== 'visible') return;
    
    fadePhase = 'fadingOut';
    
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
    
    // Start fading out logo and background together
    logoVisible = false;
    backgroundVisible = false;
    
    // Remove the component after fade completes
    setTimeout(() => {
      showWelcome = false;
      fadePhase = 'hidden';
    }, 1200); // Match the CSS transition duration
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
      <div class="logo-container" class:logo-visible={logoVisible}>
        <Logo variant={darkMode ? 'white' : 'black'} rotationSpeed={10} size={250} />
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

  .logo-container {
    position: relative;
    z-index: 1;
    opacity: 0;
    transition: opacity 0.8s ease-in-out;
  }

  .logo-container.logo-visible {
    opacity: 1;
  }
</style> 