<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { parseBoldText } from '$lib/utils/boldText';
  export let text: string = "ART CAMP EST.2016";
  export let fontSize: number = 40;
  export let radius: number = 180;
  export let rotationSpeed: number = -0.2;
  export let spacingAmplitudePercent: number = 2;
  export let spacingSpeed: number = 0.28;
  export let rotationStart: number = 0; // degrees
  export let animationType: string = 'sin';
  export let containerSize: number = 500;
  export let paused: boolean = false;
  export let textColor: string = "#171717";
  export let autoTextSize: boolean = false; // When true, scale font to fill circumference
  export let startInvisible: boolean = false; // If true, start with letters invisible
  export let primaryFontFamily: string = 'CircularXXWeb';
  
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

  // Parsed letters with bold support (**bold** in text)
  $: parsedLetters = parseBoldText(text);

  // Initialize letter arrays when text changes (preserve opacities during typewriter to avoid glitches)
  $: {
    const letters = parsedLetters;
    const newLen = letters.length;
    if (letterOpacities.length !== newLen) {
      if (newLen > letterOpacities.length) {
        // Expanding (e.g. typewriter): preserve existing opacities, add new at full
        const next = [...letterOpacities];
        while (next.length < newLen) next.push(1);
        letterOpacities = next;
        letterFadeStartTimes = letterFadeStartTimes.slice(0, newLen);
        while (letterFadeStartTimes.length < newLen) letterFadeStartTimes.push(0);
      } else {
        // Shrinking (e.g. delete): keep opacities for remaining letters
        letterOpacities = letterOpacities.slice(0, newLen);
        letterFadeStartTimes = letterFadeStartTimes.slice(0, newLen);
      }
    }
  }

  function generateRandomFadeTimes() {
    const letters = parsedLetters;
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

    if (fadePhase === 'fadingIn') {
      // Simple global fade — all letters same opacity, no stagger, no per-letter computation
      const t = Math.max(0, Math.min(1, timeSincePhaseStart / totalFadeTime));
      const opacity = t * t * (3 - 2 * t); // smoothstep
      for (let i = 0; i < letterOpacities.length; i++) {
        letterOpacities[i] = opacity;
      }
    } else {
      // Staggered fade out per letter
      letterOpacities = letterOpacities.map((_, i) => {
        const letterStartTime = letterFadeStartTimes[i] * totalFadeTime * 0.7;
        const letterFadeDuration = totalFadeTime * 0.5;
        const letterProgress = Math.max(0, Math.min(1, (timeSincePhaseStart - letterStartTime) / letterFadeDuration));
        const eased = letterProgress * letterProgress * (3 - 2 * letterProgress);
        return Math.max(0, 1 - eased);
      });
    }
  }

  // Compute effective font size and adaptive radius when autoTextSize is enabled
  let measureCanvas: HTMLCanvasElement | null = null;
  let adaptiveRadius = radius;

  function computeAutoSize(textStr: string, baseRadius: number): { fontSize: number; radius: number } {
    if (!autoTextSize || baseRadius <= 0 || !browser) return { fontSize, radius: baseRadius };
    if (!measureCanvas) measureCanvas = document.createElement('canvas');
    const ctx = measureCanvas.getContext('2d');
    if (!ctx) return { fontSize, radius: baseRadius };

    const letters = parseBoldText(textStr);
    if (letters.length === 0) return { fontSize, radius: baseRadius };

    const fontFamily = `"${primaryFontFamily}", Arial, Helvetica, sans-serif`;
    const halfContainer = containerSize / 2;

    // Measure total text width at a reference font size
    const refSize = 200;
    const totalWidthAtRef = letters.reduce((sum, { char, bold }) => {
      ctx.font = bold ? `bold ${refSize}px ${fontFamily}` : `${refSize}px ${fontFamily}`;
      return sum + ctx.measureText(char).width;
    }, 0);
    if (totalWidthAtRef <= 0) return { fontSize, radius: baseRadius };

    // For a given radius r, the circumference is 2*PI*r
    // The ideal font size to fill 70% of circumference: size = (2*PI*r * 0.70) / totalWidthAtRef * refSize
    // The font must not exceed (halfContainer - r) * ascentFactor so letters don't clip
    // We want the largest font possible, so we search for the best radius

    const ascentFactor = 0.85; // how much of fontSize extends outward from baseline
    let bestFontSize = fontSize;
    let bestRadius = baseRadius;

    // Try radii from small to large, find the one that maximizes font size without clipping
    const minR = halfContainer * 0.15;
    const maxR = halfContainer * 0.7;
    const steps = 30;

    for (let i = 0; i <= steps; i++) {
      const r = minR + (maxR - minR) * (i / steps);
      const circumference = 2 * Math.PI * r * 0.70;
      const idealSize = (circumference / totalWidthAtRef) * refSize;
      const maxByEdge = (halfContainer - r) / ascentFactor;
      const clampedSize = Math.min(idealSize, maxByEdge);

      if (clampedSize > bestFontSize) {
        bestFontSize = clampedSize;
        bestRadius = r;
      }
    }

    return { fontSize: Math.max(2, bestFontSize), radius: bestRadius };
  }

  // Legacy function for non-autoTextSize mode
  function computeEffectiveFontSize(baseFontSize: number, textStr: string, r: number): number {
    if (!autoTextSize || r <= 0) return baseFontSize;
    // autoTextSize is handled by computeAutoSize
    return baseFontSize;
  }

  $: autoResult = computeAutoSize(text, radius);
  $: effectiveFontSize = autoTextSize ? autoResult.fontSize : computeEffectiveFontSize(fontSize, text, radius);
  $: adaptiveRadius = autoTextSize ? autoResult.radius : radius;

  function draw() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    const baseDpr = window.devicePixelRatio || 1;
    const isMobileCanvas = window.innerWidth < 768;
    const dpr = isMobileCanvas ? Math.max(baseDpr * 2.5, 6) : baseDpr;
    if (isMobileCanvas && 'imageSmoothingQuality' in ctx) {
      (ctx as CanvasRenderingContext2D & { imageSmoothingQuality: string }).imageSmoothingQuality = 'high';
    }
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
    const letters = parsedLetters;
    const fontFamily = `"${primaryFontFamily}", Arial, Helvetica, sans-serif`;
    const drawRadius = autoTextSize ? adaptiveRadius : radius;
    const letterWidths = letters.map(({ char, bold }) => {
      ctx.font = bold ? `bold ${effectiveFontSize}px ${fontFamily}` : `${effectiveFontSize}px ${fontFamily}`;
      return ctx.measureText(char).width;
    });
    const totalWidth = letterWidths.reduce((a, b) => a + b, 0);
    const circumference = 2 * Math.PI * drawRadius;
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
      ctx.translate(0, -drawRadius);
      const { char, bold } = letters[i];
      ctx.font = bold ? `bold ${effectiveFontSize}px ${fontFamily}` : `${effectiveFontSize}px ${fontFamily}`;

      // Apply opacity from fade animation (default to 1 for new letters to avoid white flash)
      const opacity = letterOpacities[i] !== undefined ? letterOpacities[i] : 1;
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
      
      ctx.fillText(char, 0, 0);
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
    const fontFamily = `"${primaryFontFamily}", Arial, Helvetica, sans-serif`;
    
    // Enable better text rendering
    ctx.textRendering = 'geometricPrecision';
    ctx.fontKerning = 'normal';
    ctx.textBaseline = 'alphabetic';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw text with high quality settings (support **bold**)
    const letters = parseBoldText(text);
    const captureFontSize = effectiveFontSize;
    const fullFontFamily = `"${primaryFontFamily}", Arial, Helvetica, sans-serif`;

    const letterWidths = letters.map(({ char, bold }) => {
      ctx.font = bold ? `bold ${captureFontSize}px ${fullFontFamily}` : `${captureFontSize}px ${fullFontFamily}`;
      return ctx.measureText(char).width;
    });
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
      
      const { char, bold } = letters[i];
      ctx.font = bold ? `bold ${highResFontSize}px ${fontFamily}` : `${highResFontSize}px ${fontFamily}`;
      
      // Apply opacity from fade animation (default to 1 for new letters to avoid white flash)
      const opacity = letterOpacities[i] !== undefined ? letterOpacities[i] : 1;
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      
      ctx.textAlign = 'center';
      
      // For high-res rendering, add subtle shadow for better readability
      if (highRes) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 0.5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      ctx.fillText(char, 0, 0);
      ctx.restore();
      currentAngle += letterArc + spacingArc;
    }
    
    return captureCanvas;
  }

  // Expose the live canvas element for consumers (e.g., recording without re-render)
  export function getCanvas(): HTMLCanvasElement | null {
    return canvas || null;
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
    // Ensure custom fonts are loaded BEFORE first draw to prevent weight flash
    if (browser && (document as any).fonts?.ready) {
      try {
        // Wait until all document fonts are ready
        (document as any).fonts.ready.then(() => {
          draw();
        }).catch(() => { try { draw(); } catch {} });
      } catch {
        try { draw(); } catch {}
      }
    } else if (browser && (document as any).fonts?.load) {
      try {
        (document as any).fonts.load(`16px "${primaryFontFamily}"`).then(() => {
          draw();
        }).catch(() => { try { draw(); } catch {} });
      } catch { try { draw(); } catch {} }
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
    
    // Start animation only after at least one draw queued post fonts readiness
    // Small delay ensures fonts-applied canvas paint
    setTimeout(() => startAnimation(), 0);
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
  /* Use default image rendering for smooth text (avoid optimizeSpeed which reduces quality) */
}
</style> 