<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  export let text: string = "circle studio";
  export let fontSize: number = 40;
  export let radius: number = 180;
  export let rotationSpeed: number = -0.2;
  export let spacingAmplitudePercent: number = 2;
  export let spacingSpeed: number = 0.28;
  export let rotationStart: number = 0; // degrees
  export let animationType: string = 'sin';
  export let containerSize: number = 500;
  export let paused: boolean = false;
  export let textColor: string = "#000000";
  export let autoTextSize: boolean = false; // When true, scale font to fill circumference
  export let startInvisible: boolean = false; // If true, start with letters invisible
  
  // Fade animation props
  export let fadeInTime: number = 3; // seconds to fade in all letters
  export let fadeOutTime: number = 3; // seconds to fade out all letters
  export let pauseTime: number = 2; // seconds to pause after fade out
  export let visibleTime: number = 4; // seconds letters stay fully visible
  export let manualMode: boolean = false; // if true, only manual triggers work
  export let triggerFadeIn: boolean = false; // manual trigger for fade in
  export let triggerFadeOut: boolean = false; // manual trigger for fade out

  let canvas: HTMLCanvasElement;
  let animationFrame: number;
  let rotation = 0;
  let isAnimating = false;
  let lastTimestamp = 0;
  let elapsedTime = 0;

  // Audio-aware throttling
  let audioThrottleLevel = 0; // 0 = normal, 1 = reduced, 2 = minimal
  let lastAudioCheck = 0;

  // Fade animation state
  let letterOpacities: number[] = [];
  let letterFadeStartTimes: number[] = [];
  let fadePhase: 'paused' | 'fadingIn' | 'fullyVisible' | 'fadingOut' = 'paused';
  let phaseStartTime = 0;
  let lastTriggerFadeIn = false;
  let lastTriggerFadeOut = false;

  // Initialize letter arrays when text changes
  $: {
    const letters = text.split('');
    if (letterOpacities.length !== letters.length) {
      letterOpacities = new Array(letters.length).fill(0);
      letterFadeStartTimes = new Array(letters.length).fill(0);
      generateRandomFadeTimes();
    }
  }

  function generateRandomFadeTimes() {
    const letters = text.split('');
    letterFadeStartTimes = letters.map((_, i) => Math.random());
    // Sort to ensure we have a good distribution
    letterFadeStartTimes.sort((a, b) => a - b);
  }

  function updateFadeAnimation() {
    if (manualMode) {
      // Handle manual triggers
      if (triggerFadeIn && !lastTriggerFadeIn) {
        startFadeIn();
      }
      if (triggerFadeOut && !lastTriggerFadeOut) {
        startFadeOut();
      }
      lastTriggerFadeIn = triggerFadeIn;
      lastTriggerFadeOut = triggerFadeOut;
      return;
    }

    // Automatic mode
    const currentTime = elapsedTime;
    const timeSincePhaseStart = currentTime - phaseStartTime;

    switch (fadePhase) {
      case 'paused':
        if (timeSincePhaseStart >= pauseTime) {
          startFadeIn();
        }
        break;
      case 'fadingIn':
        if (timeSincePhaseStart >= fadeInTime) {
          fadePhase = 'fullyVisible';
          phaseStartTime = currentTime;
          // Set all letters to fully visible
          letterOpacities = letterOpacities.map(() => 1);
        }
        break;
      case 'fullyVisible':
        if (timeSincePhaseStart >= visibleTime) {
          startFadeOut();
        }
        break;
      case 'fadingOut':
        if (timeSincePhaseStart >= fadeOutTime) {
          // Check if all letters have actually faded out before switching phase
          const allLettersFaded = letterOpacities.every(opacity => opacity <= 0.01);
          if (allLettersFaded || timeSincePhaseStart >= fadeOutTime * 1.5) {
            fadePhase = 'paused';
            phaseStartTime = currentTime;
            // Set all letters to invisible only after they've all faded
            letterOpacities = letterOpacities.map(() => 0);
            // Generate new random times for next cycle
            generateRandomFadeTimes();
          }
        }
        break;
    }
  }

  function startFadeIn() {
    fadePhase = 'fadingIn';
    phaseStartTime = elapsedTime;
    generateRandomFadeTimes();
  }

  function startFadeOut() {
    fadePhase = 'fadingOut';
    phaseStartTime = elapsedTime;
    generateRandomFadeTimes();
  }

  function updateLetterOpacities() {
    if (fadePhase === 'fullyVisible') {
      letterOpacities = letterOpacities.map(() => 1);
      return;
    }
    if (fadePhase === 'paused') {
      letterOpacities = letterOpacities.map(() => 0);
      return;
    }

    const currentTime = elapsedTime;
    const timeSincePhaseStart = currentTime - phaseStartTime;
    const totalFadeTime = fadePhase === 'fadingIn' ? fadeInTime : fadeOutTime;

    letterOpacities = letterOpacities.map((_, i) => {
      const letterStartTime = letterFadeStartTimes[i] * totalFadeTime * 0.7; // Start within first 70% of fade time
      const letterFadeDuration = totalFadeTime * 0.5; // Each letter takes 50% of total time to fade
      const letterProgress = Math.max(0, Math.min(1, (timeSincePhaseStart - letterStartTime) / letterFadeDuration));
      
      if (fadePhase === 'fadingIn') {
        return letterProgress;
      } else {
        // Ensure smooth fade out with proper easing at the end
        const opacity = 1 - letterProgress;
        return Math.max(0, opacity);
      }
    });
  }

  // Compute effective font size when autoTextSize is enabled
  let measureCanvas: HTMLCanvasElement | null = null;
  function computeEffectiveFontSize(baseFontSize: number, textStr: string, r: number): number {
    if (!autoTextSize || r <= 0) return baseFontSize;
    if (!browser) return baseFontSize;
    if (!measureCanvas) measureCanvas = document.createElement('canvas');
    const ctx = measureCanvas.getContext('2d');
    if (!ctx) return baseFontSize;
    ctx.font = `${baseFontSize}px "CircularXXWeb", Arial, Helvetica, sans-serif`;
    const letters = textStr.split('');
    const totalWidth = letters.reduce((sum, l) => sum + ctx.measureText(l).width, 0);
    const circumference = 2 * Math.PI * r;
    if (totalWidth <= 0 || circumference <= 0) return baseFontSize;
    // Scale proportionally so total width matches circumference; leave a tiny margin
    const scale = circumference / totalWidth;
    const sized = baseFontSize * scale * 0.995; // small safety margin to avoid overflow
    // Prevent absurd values
    const minSize = 2;
    // Edge-guard: ensure glyphs don't get cut off beyond canvas bounds
    // Available outward space from the text baseline to the canvas edge
    const edgeMargin = 2; // small inner margin in px
    const availableOutward = Math.max(0, (containerSize / 2) - r - edgeMargin);
    // Approximate ascent proportion of the font (portion above baseline)
    const ascentFactor = 0.9; // conservative
    const maxByEdge = availableOutward / ascentFactor;
    const genericCap = Math.max(4, (containerSize / 2));
    const maxSize = Math.max(4, Math.min(genericCap, maxByEdge));
    return Math.min(Math.max(sized, minSize), maxSize);
  }

  $: effectiveFontSize = computeEffectiveFontSize(fontSize, text, radius);

  function draw() {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width = containerSize * dpr;
    const height = canvas.height = containerSize * dpr;
    canvas.style.width = `${containerSize}px`;
    canvas.style.height = `${containerSize}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(containerSize / 2, containerSize / 2);
    ctx.rotate(rotation + (rotationStart * Math.PI / 180));

    // Use elapsedTime instead of performance.now() to allow freezing animations
    const time = elapsedTime;
    const letters = text.split('');
    ctx.font = `${effectiveFontSize}px "CircularXXWeb", Arial, Helvetica, sans-serif`;
    const letterWidths = letters.map(l => ctx.measureText(l).width);
    const totalWidth = letterWidths.reduce((a, b) => a + b, 0);
    const circumference = 2 * Math.PI * radius;
    let maxSpacingTotal = Math.max(0, circumference - totalWidth);
    let maxSpacingPerLetter = letters.length > 0 ? maxSpacingTotal / letters.length : 0;
    let maxSpacingPercent = (maxSpacingPerLetter / circumference) * 100;
    let spacingAmplitude = Math.min(spacingAmplitudePercent, maxSpacingPercent);
    let currentAngle = 0;

    // Easing functions
    function easeIn(t: number) { return t * t; }
    function easeOut(t: number) { return t * (2 - t); }
    function steps(t: number, steps: number = 5) { return Math.floor(t * steps) / steps; }

    // Calculate phase (0..1)
    const phase = (time * spacingSpeed) % 1;
    let animValue = 0;
    if (animationType === 'sin') {
      animValue = 0.5 + 0.5 * Math.sin(time * spacingSpeed * 2 * Math.PI);
    } else if (animationType === 'linear') {
      animValue = phase;
    } else if (animationType === 'ease-in') {
      animValue = easeIn(phase);
    } else if (animationType === 'ease-out') {
      animValue = easeOut(phase);
    } else if (animationType === 'steps') {
      animValue = steps(phase, 5);
    } else {
      animValue = 0.5 + 0.5 * Math.sin(time * spacingSpeed * 2 * Math.PI);
    }

    // Optimize drawing when audio is playing
    const shouldOptimize = audioThrottleLevel > 0;
    
    for (let i = 0; i < letters.length; i++) {
      const letterArc = (letterWidths[i] / circumference) * 2 * Math.PI;
      const spacing = (spacingAmplitude / 100) * circumference * animValue;
      const spacingArc = (spacing / circumference) * 2 * Math.PI;
      const angle = currentAngle + letterArc / 2;
      ctx.save();
      ctx.rotate(angle);
      ctx.translate(0, -radius);
      ctx.font = `${effectiveFontSize}px "CircularXXWeb", Arial, Helvetica, sans-serif`;
      
      // Apply opacity from fade animation
      const opacity = letterOpacities[i] || 0;
      const rgb = hexToRgb(textColor);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      
      // Skip drawing very transparent letters when optimizing
      if (shouldOptimize && opacity < 0.1) {
        ctx.restore();
        currentAngle += letterArc + spacingArc;
        continue;
      }
      
      ctx.fillText(letters[i], 0, 0);
      ctx.restore();
      currentAngle += letterArc + spacingArc;
    }
    ctx.restore();
  }

  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  function animate(timestamp: number) {
    if (!lastTimestamp) {
      lastTimestamp = timestamp;
    }
    
    const deltaTime = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    
    if (!paused) {
      rotation += rotationSpeed * deltaTime;
      elapsedTime += deltaTime;
      
      // Update fade animations
      updateFadeAnimation();
      updateLetterOpacities();
    }
    
    draw();
    
    if (isAnimating) {
      animationFrame = requestAnimationFrame(animate);
    }
  }

  // Optimized animation using setTimeout for better audio compatibility
  function animateOptimized() {
    if (!paused) {
      // Use fixed time step for consistent rotation regardless of frame timing
      const deltaTime = 1 / 60; // 60 FPS target
      rotation += rotationSpeed * deltaTime;
      elapsedTime += deltaTime;
      
      // Update fade animations
      updateFadeAnimation();
      updateLetterOpacities();
    }
    
    draw();
    
    if (isAnimating) {
      // Audio-aware throttling
      const now = Date.now();
      if (now - lastAudioCheck > 1000) { // Check every second
        checkAudioThrottling();
        lastAudioCheck = now;
      }
      
      // Adjust timing based on audio throttle level
      let delay = 16; // Default 60 FPS
      if (audioThrottleLevel === 1) delay = 32; // 30 FPS
      if (audioThrottleLevel === 2) delay = 50; // 20 FPS
      
      setTimeout(animateOptimized, delay);
    }
  }

  // Check if video is playing with sound and adjust throttling
  function checkAudioThrottling() {
    if (!browser) return;
    
    // Look for video elements playing with sound
    const videos = document.querySelectorAll('video');
    let hasAudioPlaying = false;
    
    videos.forEach(video => {
      if (!video.paused && !video.muted && video.volume > 0) {
        hasAudioPlaying = true;
      }
    });
    
    // Adjust throttle level based on audio state
    if (hasAudioPlaying) {
      audioThrottleLevel = Math.min(audioThrottleLevel + 1, 2);
    } else {
      audioThrottleLevel = Math.max(audioThrottleLevel - 1, 0);
    }
  }

  function startAnimation() {
    if (!isAnimating) {
      isAnimating = true;
      lastTimestamp = 0;
      // Use optimized animation for better audio compatibility
      animateOptimized();
    }
  }

  function stopAnimation() {
    isAnimating = false;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  }

  // Method to capture the current state of the canvas for saving
  export function captureCanvas(highRes = false): HTMLCanvasElement | null {
    if (!canvas) return null;
    
    // Create a new canvas for the capture to avoid modifying the visible one
    const captureCanvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    
    // If highRes is true, use a significantly higher resolution canvas
    const scaleFactor = highRes ? 4 : 1;
    
    captureCanvas.width = containerSize * dpr * scaleFactor;
    captureCanvas.height = containerSize * dpr * scaleFactor;
    
    const ctx = captureCanvas.getContext('2d', { alpha: true });
    if (!ctx) return null;
    
    // Clear and prepare the capture canvas
    ctx.clearRect(0, 0, captureCanvas.width, captureCanvas.height);
    
    // Scale everything according to DPR and scaleFactor
    ctx.scale(dpr * scaleFactor, dpr * scaleFactor);
    ctx.translate(containerSize / 2, containerSize / 2);
    ctx.rotate(rotation + (rotationStart * Math.PI / 180));
    
    // Use a proper font with better scaling properties
    const fontFamily = '"CircularXXWeb", Arial, Helvetica, sans-serif';
    
    // Enable better text rendering
    ctx.textRendering = 'geometricPrecision';
    ctx.fontKerning = 'normal';
    ctx.textBaseline = 'alphabetic';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw text with high quality settings
    const letters = text.split('');
    const captureFontSize = effectiveFontSize;
    ctx.font = `${captureFontSize}px ${fontFamily}`;

    const letterWidths = letters.map(l => ctx.measureText(l).width);
    const totalWidth = letterWidths.reduce((a, b) => a + b, 0);
    const circumference = 2 * Math.PI * radius;
    let maxSpacingTotal = Math.max(0, circumference - totalWidth);
    let maxSpacingPerLetter = letters.length > 0 ? maxSpacingTotal / letters.length : 0;
    let maxSpacingPercent = (maxSpacingPerLetter / circumference) * 100;
    let spacingAmplitude = Math.min(spacingAmplitudePercent, maxSpacingPercent);
    let currentAngle = 0;
    
    // Easing functions
    function easeIn(t: number) { return t * t; }
    function easeOut(t: number) { return t * (2 - t); }
    function steps(t: number, steps: number = 5) { return Math.floor(t * steps) / steps; }
    
    // Calculate phase (0..1)
    const time = elapsedTime;
    const phase = (time * spacingSpeed) % 1;
    let animValue = 0;
    if (animationType === 'sin') {
      animValue = 0.5 + 0.5 * Math.sin(time * spacingSpeed * 2 * Math.PI);
    } else if (animationType === 'linear') {
      animValue = phase;
    } else if (animationType === 'ease-in') {
      animValue = easeIn(phase);
    } else if (animationType === 'ease-out') {
      animValue = easeOut(phase);
    } else if (animationType === 'steps') {
      animValue = steps(phase, 5);
    } else {
      animValue = 0.5 + 0.5 * Math.sin(time * spacingSpeed * 2 * Math.PI);
    }
    
    // Use a slightly larger font for high-res rendering to ensure sharp text
    const highResFontSize = highRes ? captureFontSize * 1.05 : captureFontSize;
    const rgb = hexToRgb(textColor);
    
    for (let i = 0; i < letters.length; i++) {
      const letterArc = (letterWidths[i] / circumference) * 2 * Math.PI;
      const spacing = (spacingAmplitude / 100) * circumference * animValue;
      const spacingArc = (spacing / circumference) * 2 * Math.PI;
      const angle = currentAngle + letterArc / 2;
      ctx.save();
      ctx.rotate(angle);
      ctx.translate(0, -radius);
      
      // Use a slightly larger font for high-res rendering
      ctx.font = `${highResFontSize}px ${fontFamily}`;
      
      // Apply opacity from fade animation
      const opacity = letterOpacities[i] || 0;
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      
      ctx.textAlign = 'center';
      
      // Apply subpixel positioning for better text rendering
      const letter = letters[i];
      
      // For high-res rendering, add subtle shadow for better readability
      if (highRes) {
        // Add subtle shadow/edges for sharper text
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 0.5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      ctx.fillText(letter, 0, 0);
      ctx.restore();
      currentAngle += letterArc + spacingArc;
    }
    
    return captureCanvas;
  }

  // Watch for paused state changes
  $: {
    if (canvas) {
      if (!paused && !isAnimating) {
        startAnimation();
      }
      // Don't stop the animation loop when paused, just freeze the rotation and animations
    }
  }

  // Initialize fade animation on mount
  onMount(() => {
    // Ensure custom font is loaded for accurate measurements
    if (browser && (document as any).fonts?.load) {
      try {
        // Load a typical size; metrics will be correct for others
        (document as any).fonts.load('16px "CircularXXWeb"').then(() => {
          draw();
        }).catch(() => {});
      } catch {}
    }
    
    const letters = text.split('');
    if (startInvisible) {
      // Start hidden and wait for manual trigger to fade in
      letterOpacities = new Array(letters.length).fill(0);
      letterFadeStartTimes = new Array(letters.length).fill(0);
      fadePhase = 'paused';
      phaseStartTime = 0;
    } else {
      // Default: fully visible
      letterOpacities = new Array(letters.length).fill(1);
      letterFadeStartTimes = new Array(letters.length).fill(0);
      fadePhase = 'fullyVisible';
      phaseStartTime = 0;
    }
    
    startAnimation();
    return () => stopAnimation();
  });
</script>

<canvas bind:this={canvas}></canvas>

<style>
canvas {
  display: block;
  margin: 0 auto;
  background: transparent;
  /* Hardware acceleration for smoother animations */
  transform: translateZ(0);
  will-change: transform;
  /* Audio-aware throttling - reduce repaints when audio is playing */
  image-rendering: optimizeSpeed;
}
</style> 