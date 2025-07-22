<script lang="ts">
  import TextCircle from './TextCircle.svelte';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { 
    Button, 
    Slider, 
    Input, 
    Checkbox, 
    Select, 
    RecordingIndicator,
    FileUpload,
    type SelectOption 
  } from '../primitives';

  export let config: {
    uiVisible?: boolean;
    items?: CircleConfig[];
    globalSettings?: {
      containerSizePercent?: number;
      fontSizePercent?: number;
      distancePercent?: number;
      paused?: boolean;
      textColor?: string;
      backgroundColor?: string;
      transparentBackground?: boolean;
      saveStillTrigger?: boolean;
      startRecording?: boolean;
      stopRecording?: boolean;
      exportResolution?: number;
      useHighResRecording?: boolean;
      fadeInTime?: number;
      fadeOutTime?: number;
      pauseTime?: number;
      visibleTime?: number;
      manualMode?: boolean;
      triggerFadeIn?: boolean;
      triggerFadeOut?: boolean;
    };
  } = {
    uiVisible: false,
    items: undefined,
    globalSettings: undefined
  };

  // Extract values from config for easier use
  $: items = config.items;
  $: globalSettings = config.globalSettings;
  $: uiVisible = config.uiVisible ?? false;

  type CircleConfig = {
    text: string;
    rotationSpeed: number;
    spacingAmplitudePercent: number;
    spacingSpeed: number;
    rotationStart: number; // degrees, 0-360
    animationType?: string; // 'sin', 'linear', 'ease-in', 'ease-out', 'steps'
  };

  
  let showControls = false;
  $: showControls = uiVisible; // React to uiVisible changes
  let controlsInitialized = false;
  let paused = false;
  let textColor = "#000000";
  let backgroundColor = "#ffffff";
  let transparentBackground = false;
  let maxFontSizePercent = 20;
  let fontSizePercent = 9; // percent of container size
  let distancePercent = 0.2; // percent of container size
  let useHighResRecording = false; // Whether to use high-res for recording
  
  // Fade animation controls
  let fadeInTime = 3; // seconds
  let fadeOutTime = 3; // seconds  
  let pauseTime = 2; // seconds
  let visibleTime = 4; // seconds
  let manualMode = false;
  let triggerFadeIn = false;
  let triggerFadeOut = false;
  
  let circles: CircleConfig[] = [
    {
      text: 'circle studio',
      rotationSpeed: 0.2,
      spacingAmplitudePercent: 2,
      spacingSpeed: 0.28,
      rotationStart: 0,
      animationType: 'sin',
    }
  ];

  // Animation type options for select component
  const animationOptions: SelectOption[] = [
    { value: 'sin', label: 'Sinusoidal' },
    { value: 'linear', label: 'Linear' },
    { value: 'ease-in', label: 'Ease In' },
    { value: 'ease-out', label: 'Ease Out' },
    { value: 'steps', label: 'Steps' }
  ];
  const baseContainerSize = 600;
  let exportResolution = 600; // Default export resolution
  let containerElement: HTMLDivElement;
  let textCircleRefs: TextCircle[] = [];

  // Video recording variables
  let isRecording = false;
  let recorder: RecordRTCType | undefined;
  let recordingStream: MediaStream | undefined;
  let FPS = 30; // Fixed at 30 FPS
  let elapsedTime = 0; // Elapsed recording time in seconds
  let timerInterval: ReturnType<typeof setInterval>; // Timer interval reference
  
  // Background media variables
  let backgroundMedia: HTMLImageElement | HTMLVideoElement | null = null;
  let backgroundMediaType: 'image' | 'video' | null = null;
  let currentBackgroundFile: { name: string; type: string; url: string } | null = null;
  let backgroundOpacity = 1.0; // Background opacity control
  let backgroundScale = 100; // Background scale percentage
  let backgroundPositionX = 50; // Background position X percentage
  let backgroundPositionY = 50; // Background position Y percentage
  
  $: containerSizePercent = 100;
  $: containerSize = (showControls || (!items && !globalSettings))
    ? (containerSizePercent / 100) * baseContainerSize
    : ((globalSettings?.containerSizePercent ?? containerSizePercent) / 100) * baseContainerSize;
  $: fontSize = (showControls || (!items && !globalSettings))
    ? (fontSizePercent / 100) * containerSize
    : ((globalSettings?.fontSizePercent ?? fontSizePercent) / 100) * containerSize;
  $: distanceBetweenCircles = (showControls || (!items && !globalSettings))
    ? (distancePercent / 100) * containerSize
    : ((globalSettings?.distancePercent ?? distancePercent) / 100) * containerSize;
  $: N = renderCircles.length;
  $: maxFontSizePx = containerSize / (2.4 + N);
  $: maxFontSizePercent = (maxFontSizePx / containerSize) * 100;
  $: { if ((showControls || (!items && !globalSettings)) && fontSizePercent > maxFontSizePercent) fontSizePercent = maxFontSizePercent; }
  $: outermostRadius = (containerSize / 2) - fontSize * 1.2;
  $: getRadius = (i: number) => outermostRadius - i * (fontSize + distanceBetweenCircles);
  $: animationPaused = (showControls || (!items && !globalSettings)) 
    ? paused 
    : (globalSettings?.paused ?? paused);
  $: activeTextColor = (showControls || (!items && !globalSettings))
    ? textColor
    : (globalSettings?.textColor ?? textColor);
  $: activeBackgroundColor = (showControls || (!items && !globalSettings))
    ? (transparentBackground ? 'transparent' : backgroundColor)
    : (globalSettings?.transparentBackground ? 'transparent' : (globalSettings?.backgroundColor ?? backgroundColor));
  $: activeExportResolution = (showControls || (!items && !globalSettings))
    ? exportResolution
    : (globalSettings?.exportResolution ?? exportResolution);
  $: activeUseHighResRecording = (showControls || (!items && !globalSettings))
    ? useHighResRecording
    : (globalSettings?.useHighResRecording ?? useHighResRecording);
  $: activeFadeInTime = (showControls || (!items && !globalSettings))
    ? fadeInTime
    : (globalSettings?.fadeInTime ?? fadeInTime);
  $: activeFadeOutTime = (showControls || (!items && !globalSettings))
    ? fadeOutTime
    : (globalSettings?.fadeOutTime ?? fadeOutTime);
  $: activePauseTime = (showControls || (!items && !globalSettings))
    ? pauseTime
    : (globalSettings?.pauseTime ?? pauseTime);
  $: activeVisibleTime = (showControls || (!items && !globalSettings))
    ? visibleTime
    : (globalSettings?.visibleTime ?? visibleTime);
  $: activeManualMode = (showControls || (!items && !globalSettings))
    ? manualMode
    : (globalSettings?.manualMode ?? manualMode);
  $: activeTriggerFadeIn = (showControls || (!items && !globalSettings))
    ? triggerFadeIn
    : (globalSettings?.triggerFadeIn ?? triggerFadeIn);
  $: activeTriggerFadeOut = (showControls || (!items && !globalSettings))
    ? triggerFadeOut
    : (globalSettings?.triggerFadeOut ?? triggerFadeOut);

  // Initialize from props if uiVisible is true from the start
  onMount(() => {
    if (uiVisible && (items || globalSettings)) {
      initializeFromProps();
    }
  });

  function initializeFromProps() {
    if (items) {
      circles = items.map(item => ({
        text: item.text,
        rotationSpeed: item.rotationSpeed,
        spacingAmplitudePercent: item.spacingAmplitudePercent,
        spacingSpeed: item.spacingSpeed,
        rotationStart: item.rotationStart,
        animationType: item.animationType ?? 'sin',
      }));
    }
    if (globalSettings) {
      if (globalSettings.containerSizePercent !== undefined) containerSizePercent = globalSettings.containerSizePercent;
      if (globalSettings.fontSizePercent !== undefined) fontSizePercent = globalSettings.fontSizePercent;
      if (globalSettings.distancePercent !== undefined) distancePercent = globalSettings.distancePercent;
      if (globalSettings.paused !== undefined) paused = globalSettings.paused;
      if (globalSettings.textColor !== undefined) textColor = globalSettings.textColor;
      if (globalSettings.backgroundColor !== undefined) backgroundColor = globalSettings.backgroundColor;
      if (globalSettings.transparentBackground !== undefined) transparentBackground = globalSettings.transparentBackground;
      if (globalSettings.exportResolution !== undefined) exportResolution = globalSettings.exportResolution;
      if (globalSettings.useHighResRecording !== undefined) useHighResRecording = globalSettings.useHighResRecording;
      if (globalSettings.fadeInTime !== undefined) fadeInTime = globalSettings.fadeInTime;
      if (globalSettings.fadeOutTime !== undefined) fadeOutTime = globalSettings.fadeOutTime;
      if (globalSettings.pauseTime !== undefined) pauseTime = globalSettings.pauseTime;
      if (globalSettings.visibleTime !== undefined) visibleTime = globalSettings.visibleTime;
      if (globalSettings.manualMode !== undefined) manualMode = globalSettings.manualMode;
      if (globalSettings.triggerFadeIn !== undefined) triggerFadeIn = globalSettings.triggerFadeIn;
      if (globalSettings.triggerFadeOut !== undefined) triggerFadeOut = globalSettings.triggerFadeOut;
    }
    controlsInitialized = true;
  }

  function addCircle() {
    circles = [
      ...circles,
      {
        text: 'circle studio',
        rotationSpeed: -0.2,
        spacingAmplitudePercent: 2,
        spacingSpeed: 0.28,
        rotationStart: 0,
        animationType: 'sin',
      }
    ];
  }

  function removeCircle(index: number) {
    circles = circles.filter((_, i) => i !== index);
  }

  function toggleControls() {
    showControls = !showControls;
    // On first open, copy props to internal state
    if (showControls && !controlsInitialized && (items || globalSettings)) {
      initializeFromProps();
    }
  }

  // Save the current state as a PNG image
  function saveStill() {
    if (!containerElement || !browser) return;
    
    // Use high-res for export based on user preference
    const useHighRes = activeUseHighResRecording;

    // Create a canvas to draw everything on
    const canvas = document.createElement('canvas');
    
    // Set the canvas size to the specified export resolution (always square)
    canvas.width = activeExportResolution;
    canvas.height = activeExportResolution;
    
    const ctx = canvas.getContext('2d', { alpha: transparentBackground });
    if (!ctx) return;
    
    // Apply background or leave transparent based on activeBackgroundColor
    if (activeBackgroundColor !== 'transparent') {
      ctx.fillStyle = activeBackgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Set high quality rendering options
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Create a high-resolution intermediate canvas
    const hiResCanvas = document.createElement('canvas');
    hiResCanvas.width = activeExportResolution;
    hiResCanvas.height = activeExportResolution;
    const hiResCtx = hiResCanvas.getContext('2d', { alpha: activeBackgroundColor === 'transparent' });
    
    if (hiResCtx) {
      // Clear the hi-res canvas
      hiResCtx.clearRect(0, 0, activeExportResolution, activeExportResolution);
      
      // Draw background if not transparent
      if (activeBackgroundColor !== 'transparent') {
        hiResCtx.fillStyle = activeBackgroundColor;
        hiResCtx.fillRect(0, 0, activeExportResolution, activeExportResolution);
      }
      
      // Draw background media if present
      if (backgroundMedia && currentBackgroundFile) {
        hiResCtx.save();
        hiResCtx.globalAlpha = backgroundOpacity;
        
        // Calculate position and scale for background media
        const mediaScale = backgroundScale / 100;
        const mediaX = ((backgroundPositionX - 50) * activeExportResolution) / 100;
        const mediaY = ((backgroundPositionY - 50) * activeExportResolution) / 100;
        
        // Center the media and apply transformations
        hiResCtx.translate(activeExportResolution / 2 + mediaX, activeExportResolution / 2 + mediaY);
        hiResCtx.scale(mediaScale, mediaScale);
        
        // Draw the background media centered
        hiResCtx.drawImage(
          backgroundMedia,
          -activeExportResolution / 2,
          -activeExportResolution / 2,
          activeExportResolution,
          activeExportResolution
        );
        
        hiResCtx.restore();
      }
      
      // Setup canvas for centered drawing at higher resolution
      hiResCtx.save();
      hiResCtx.translate(activeExportResolution / 2, activeExportResolution / 2);
      
      // Scale up from container size to export resolution
      const scaleFactor = activeExportResolution / containerSize;
      hiResCtx.scale(scaleFactor, scaleFactor);
      
      // Draw each TextCircle component with high quality
      textCircleRefs.forEach((textCircleComponent) => {
        if (textCircleComponent && textCircleComponent.captureCanvas) {
          const circleCanvas = textCircleComponent.captureCanvas(useHighRes);
          if (circleCanvas) {
            // Draw at original container size (will be scaled by the transform)
            hiResCtx.drawImage(
              circleCanvas,
              0,
              0,
              circleCanvas.width,
              circleCanvas.height,
              -containerSize / 2, 
              -containerSize / 2,
              containerSize,
              containerSize
            );
          }
        }
      });
      
      hiResCtx.restore();
      
      // Draw the hi-res canvas to the final canvas
      ctx.drawImage(hiResCanvas, 0, 0);
    }
    
    // Convert to PNG and trigger download
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `circle-studio-${new Date().getTime()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (e) {
      console.error('Error saving image:', e);
    }
  }

  // Function to start recording video
  async function startRecording() {
    if (isRecording || !containerElement || !browser) return;
    
    // Store the current animation state to restore later
    const wasAnimationPaused = animationPaused;
    
    try {
      // Dynamically import RecordRTC only in browser
      const RecordRTCModule = await import('recordrtc');
      const RecordRTC = RecordRTCModule.default;
      
      // Use high-res for recording based on the user's preference
      const useHighRes = activeUseHighResRecording;
      
      // Create a canvas for recording that matches the desired resolution
      const recordingCanvas = document.createElement('canvas');
      
      // Set canvas size to the selected resolution
      recordingCanvas.width = activeExportResolution;
      recordingCanvas.height = activeExportResolution;
      
      const renderContext = recordingCanvas.getContext('2d', { alpha: activeBackgroundColor === 'transparent' });
      
      if (!renderContext) {
        console.error('Failed to get canvas context for recording');
        paused = wasAnimationPaused; // Restore original state
        return;
      }
      
      // Set high quality rendering options
      renderContext.imageSmoothingEnabled = true;
      renderContext.imageSmoothingQuality = 'high';
      
      // Make sure animation is not paused during recording
      paused = false;
      
      // Set up a stream from the canvas
      recordingStream = recordingCanvas.captureStream(FPS);
      
      // Check if stream is valid
      if (!recordingStream || recordingStream.getVideoTracks().length === 0) {
        console.error('Failed to create media stream from canvas');
        paused = wasAnimationPaused; // Restore original state
        return;
      }
      
      // Calculate video bitrate based on resolution (higher for larger sizes)
      let bitrate = 8000000; // Base bitrate 8Mbps
      if (activeExportResolution >= 1440) bitrate = 16000000; // 16Mbps for 1440p
      if (activeExportResolution >= 2160) bitrate = 30000000; // 30Mbps for 4K
      
      // Initialize RecordRTC
      // @ts-ignore
      recorder = new RecordRTC(recordingStream, {
        type: 'video',
        mimeType: 'video/mp4',
        frameRate: 30,
        quality: 1, // Highest quality
        width: activeExportResolution,
        height: activeExportResolution,
        videoBitsPerSecond: bitrate,
        frameInterval: 1,
        // @ts-ignore
        numberOfAudioChannels: 0,
        disableLogs: false,
        // MP4 specific options for better compatibility
        bitsPerSecond: bitrate,
        bufferSize: 16384
      });
      
      // Start recording
      if (recorder) {
        recorder.startRecording();
      }
      isRecording = true;
      elapsedTime = 0;
      
      // Start timer to track elapsed time
      timerInterval = setInterval(() => {
        elapsedTime++;
      }, 1000);
      
      // Create a high-resolution intermediate canvas with the same aspect ratio as the container
      // but matching the pixel dimensions of the export resolution
      const hiResCanvas = document.createElement('canvas');
      hiResCanvas.width = activeExportResolution;
      hiResCanvas.height = activeExportResolution;
      const hiResCtx = hiResCanvas.getContext('2d', { alpha: activeBackgroundColor === 'transparent' });
      
      if (!hiResCtx) {
        console.error('Failed to create high-res canvas context');
        stopRecording();
        return;
      }
      
      // Set high quality rendering options for the hi-res canvas
      hiResCtx.imageSmoothingEnabled = true;
      hiResCtx.imageSmoothingQuality = 'high';
      
      // Function to capture and render frames
      function captureFrame() {
        if (!isRecording) {
          paused = wasAnimationPaused; // Restore original state if recording stopped
          return;
        }
        
        try {
          // Clear the recording canvas
          renderContext!.clearRect(0, 0, activeExportResolution, activeExportResolution);
          hiResCtx?.clearRect(0, 0, activeExportResolution, activeExportResolution);
          
          // Draw the container background to the hi-res canvas
          if (activeBackgroundColor !== 'transparent' && hiResCtx) {
            hiResCtx.fillStyle = activeBackgroundColor;
            hiResCtx.fillRect(0, 0, activeExportResolution, activeExportResolution);
          }
          
          // Draw background media if present
          if (backgroundMedia && currentBackgroundFile && hiResCtx) {
            hiResCtx.save();
            hiResCtx.globalAlpha = backgroundOpacity;
            
            // Calculate position and scale for background media
            const mediaScale = backgroundScale / 100;
            const mediaX = ((backgroundPositionX - 50) * activeExportResolution) / 100;
            const mediaY = ((backgroundPositionY - 50) * activeExportResolution) / 100;
            
            // Center the media and apply transformations
            hiResCtx.translate(activeExportResolution / 2 + mediaX, activeExportResolution / 2 + mediaY);
            hiResCtx.scale(mediaScale, mediaScale);
            
            // Draw the background media centered
            hiResCtx.drawImage(
              backgroundMedia,
              -activeExportResolution / 2,
              -activeExportResolution / 2,
              activeExportResolution,
              activeExportResolution
            );
            
            hiResCtx.restore();
          }
          
          // Draw each TextCircle component directly to the hi-res canvas with high quality
          if (hiResCtx) {
            hiResCtx.save();
            hiResCtx.translate(activeExportResolution / 2, activeExportResolution / 2);
            
            // Scale up from container size to export resolution
            const scaleFactor = activeExportResolution / containerSize;
            hiResCtx.scale(scaleFactor, scaleFactor);
            
            // Draw each TextCircle component with high quality at the proper scale
            textCircleRefs.forEach((textCircleComponent) => {
              if (textCircleComponent && textCircleComponent.captureCanvas) {
                // Use the improved captureCanvas method with highRes flag
                const circleCanvas = textCircleComponent.captureCanvas(useHighRes);
                if (circleCanvas && hiResCtx) {
                  // Draw the circle at containerSize dimensions (will be scaled up by the transform)
                  hiResCtx.drawImage(
                    circleCanvas,
                    0,
                    0,
                    circleCanvas.width,
                    circleCanvas.height,
                    -containerSize / 2, 
                    -containerSize / 2,
                    containerSize,
                    containerSize
                  );
                }
              }
            });
            
            hiResCtx.restore();
            
            // Draw the final high-res canvas to the recording canvas
            renderContext!.drawImage(hiResCanvas, 0, 0);
          }
          
          // Request next frame
          requestAnimationFrame(captureFrame);
        } catch (error) {
          console.error('Error capturing frame:', error);
          stopRecording();
        }
      }
      
      // Start the capture loop
      captureFrame();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      paused = wasAnimationPaused; // Restore original state
      isRecording = false;
    }
  }

  // Function to stop recording
  function stopRecording() {
    if (!isRecording || !recorder || !browser) return;
    
    // Store the current animation state
    const wasAnimationPaused = animationPaused;
    
    // Clear timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    try {
      recorder.stopRecording(() => {
        try {
          const blob = recorder?.getBlob();
          
          // Check if the blob is valid
          if (!blob || blob.size < 1000) {
            console.error('Recording failed: Blob is too small or invalid', blob);
            alert('Recording failed. Please try again.');
            return;
          }
          
          // Only run in browser environment
          if (browser) {
            const url = URL.createObjectURL(blob);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `circle-studio-${getFormattedDateTime()}.mp4`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            URL.revokeObjectURL(url);
          }
        } catch (error) {
          console.error('Error processing recording:', error);
          if (browser) alert('Error processing recording. Please try again.');
        } finally {
          isRecording = false;
          elapsedTime = 0; // Reset elapsed time
          
          // Restore pause state
          paused = wasAnimationPaused;
          
          if (recordingStream) {
            recordingStream.getTracks().forEach(track => track.stop());
          }
        }
      });
    } catch (error) {
      console.error('Error stopping recording:', error);
      isRecording = false;
      elapsedTime = 0;
      paused = wasAnimationPaused;
      
      if (recordingStream) {
        try {
          recordingStream.getTracks().forEach(track => track.stop());
        } catch (e) {
          console.error('Error stopping tracks:', e);
        }
      }
    }
  }

  // Toggle recording state
  function toggleRecording() {
    if (!browser) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  // Fade control functions
  function handleFadeIn() {
    if (showControls || (!items && !globalSettings)) {
      triggerFadeIn = true;
      setTimeout(() => { triggerFadeIn = false; }, 100);
    }
    // In headless mode, the parent component should control triggerFadeIn via globalSettings
  }

  function handleFadeOut() {
    if (showControls || (!items && !globalSettings)) {
      triggerFadeOut = true;
      setTimeout(() => { triggerFadeOut = false; }, 100);
    }
    // In headless mode, the parent component should control triggerFadeOut via globalSettings
  }

  // Format time as MM:SS
  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function getFormattedDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  // Background media functions
  function handleBackgroundUpload(event: CustomEvent<{ file: File; url: string; type: 'image' | 'video' }>) {
    const { file, url, type } = event.detail;
    
    // Clean up previous media
    if (currentBackgroundFile) {
      URL.revokeObjectURL(currentBackgroundFile.url);
    }

    // Set current file info
    currentBackgroundFile = {
      name: file.name,
      type: file.type,
      url: url
    };

    backgroundMediaType = type;

    // Create appropriate media element
    if (type === 'image') {
      const img = new Image();
      img.onload = () => {
        backgroundMedia = img;
      };
      img.src = url;
    } else {
      const video = document.createElement('video');
      video.loop = true;
      video.muted = true; // Required for autoplay
      video.onloadeddata = () => {
        backgroundMedia = video;
        video.play();
      };
      video.src = url;
    }
  }

  function handleBackgroundRemove() {
    if (currentBackgroundFile) {
      URL.revokeObjectURL(currentBackgroundFile.url);
    }
    backgroundMedia = null;
    backgroundMediaType = null;
    currentBackgroundFile = null;
  }

  function handleBackgroundError(event: CustomEvent<{ message: string }>) {
    alert(event.detail.message);
  }

  function toggleVideoPlayback() {
    if (backgroundMedia && backgroundMediaType === 'video') {
      const video = backgroundMedia as HTMLVideoElement;
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  }

  $: videoPlaybackLabel = (() => {
    if (backgroundMedia && backgroundMediaType === 'video') {
      const video = backgroundMedia as HTMLVideoElement;
      return video.paused ? '▶ Play' : '⏸️ Pause';
    }
    return '▶ Play';
  })();

  // Watch for external save trigger
  $: {
    if (globalSettings?.saveStillTrigger) {
      // Use the export resolution from props
      if (globalSettings.exportResolution) {
        exportResolution = globalSettings.exportResolution;
      }
      saveStill();
      
      // Reset the trigger (this would need to be handled in the parent component)
      // We can't modify the prop directly, the parent will need to reset it
    }
    
    // Watch for external recording control
    if (globalSettings?.startRecording && !isRecording) {
      if (globalSettings.exportResolution) {
        exportResolution = globalSettings.exportResolution;
      }
      startRecording();
    }
    
    if (globalSettings?.stopRecording && isRecording) {
      stopRecording();
    }
  }

  $: renderCircles = (showControls || (!items && !globalSettings)) ? circles : (items ?? circles);

  // Function to register TextCircle components for capturing
  function registerTextCircle(index: number, component: TextCircle) {
    textCircleRefs[index] = component;
  }

  // Define RecordRTC type locally
  type RecordRTCType = {
    startRecording: () => void;
    stopRecording: (callback: (url?: string) => void) => void;
    getBlob: () => Blob;
    toURL: () => string;
    save: (fileName?: string) => void;
    destroy: () => void;
  };
</script>



<div class="flex flex-col lg:flex-row gap-6 h-full w-full max-w-7xl mx-auto p-4">
  <!-- Canvas Container - Sticky on larger screens -->
  <div class="flex-shrink-0 lg:sticky lg:top-4 lg:self-start">
    <div 
      class="relative mx-auto rounded-3xl transition-all duration-200 overflow-hidden"
      style="width: {containerSize}px; height: {containerSize}px; {activeBackgroundColor !== 'transparent' ? `background-color: ${activeBackgroundColor};` : ''}"
      bind:this={containerElement}
    >
      <!-- Background Media -->
      {#if backgroundMedia && currentBackgroundFile}
        <div 
          class="absolute inset-0 flex items-center justify-center"
          style="opacity: {backgroundOpacity};"
        >
          {#if backgroundMediaType === 'image'}
            <img
              src={currentBackgroundFile.url}
              alt="Background"
              class="w-full h-full object-cover"
              style="transform: scale({backgroundScale / 100}) translate({(backgroundPositionX - 50) * 2}%, {(backgroundPositionY - 50) * 2}%);"
            />
          {:else if backgroundMediaType === 'video'}
            <video
              src={currentBackgroundFile.url}
              class="w-full h-full object-cover"
              style="transform: scale({backgroundScale / 100}) translate({(backgroundPositionX - 50) * 2}%, {(backgroundPositionY - 50) * 2}%);"
              autoplay
              loop
              muted
            >
              <track kind="captions" />
            </video>
          {/if}
        </div>
      {/if}
      {#each renderCircles as circle, i (i)}
          <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <TextCircle
            text={circle.text}
            fontSize={fontSize}
            radius={getRadius(i)}
            rotationSpeed={circle.rotationSpeed}
            spacingAmplitudePercent={circle.spacingAmplitudePercent}
            spacingSpeed={circle.spacingSpeed}
            rotationStart={circle.rotationStart}
            animationType={circle.animationType}
            containerSize={containerSize}
            paused={animationPaused}
            textColor={activeTextColor}
            fadeInTime={activeFadeInTime}
            fadeOutTime={activeFadeOutTime}
            pauseTime={activePauseTime}
            visibleTime={activeVisibleTime}
            manualMode={activeManualMode}
            triggerFadeIn={activeTriggerFadeIn}
            triggerFadeOut={activeTriggerFadeOut}
            bind:this={textCircleRefs[i]}
            />
          </div>
      {/each}
    </div>
    
    <!-- <div class="flex justify-center mt-4">
      <Button variant="secondary" on:click={toggleControls}>
        {showControls ? 'Hide Controls' : 'Show Controls'}
      </Button>
    </div> -->
  </div>

  <!-- Controls Container - Scrollable -->
  <div class="flex-1 min-w-0">
  
  {#if showControls || (!items && !globalSettings)}
    <div class="rounded-3xl p-4 mb-4 bg-white w-full">
      <h3 class="m-0 mb-4 text-lg font-bold text-gray-700 pb-2">Main Controls</h3>
      <div class="flex flex-col gap-4">
        <Slider 
          label="Canvas Size" 
          bind:value={containerSizePercent}
          min={10}
          max={200}
          step={1}
          unit="%"
          precision={0}
          tooltip="📝 Adjust the size of the canvas ({Math.round((containerSizePercent / 100) * baseContainerSize)}px)"
        />
        
        <Slider 
          label="Font Size" 
          bind:value={fontSizePercent}
          min={2}
          max={20}
          step={0.1}
          unit="%"
          precision={2}
          tooltip="📝 Font size ({Math.round((fontSizePercent / 100) * containerSize)}px)"
        />
        
        <Slider 
          label="Distance Between Circles" 
          bind:value={distancePercent}
          min={0}
          max={10}
          step={0.1}
          unit="%"
          precision={2}
          tooltip="📝 Space between circles ({Math.round((distancePercent / 100) * containerSize)}px)"
        />
        
        <div class="flex justify-between items-center p-2 rounded-3xl bg-white">
          <span>Animation:</span>
          <Button variant="primary" on:click={() => paused = !paused}>
            {paused ? '▶ Play' : '⏸️ Pause'}
          </Button>
        </div>
        
        <div class="flex gap-4 items-end">
          <Input 
            type="color" 
            label="Text Color" 
            bind:value={textColor}
            fullWidth={false}
          />
          
          <Input 
            type="color" 
            label="Background Color" 
            bind:value={backgroundColor}
            fullWidth={false}
          />
        </div>
        
        <Checkbox 
          bind:checked={transparentBackground}
          label="Transparent Background"
        />
      </div>
    </div>
    
    <!-- Fade Animation Controls -->
    <div class="bg-white rounded-3xl p-4 mb-4 w-full">
      <h3 class="m-0 mb-4 text-lg font-bold text-gray-700 border-b border-gray-200 pb-2">Fade Animation</h3>
      <div class="flex flex-col gap-4">
        <Checkbox 
          bind:checked={manualMode}
          label="Manual Mode"
          tooltip="📝 Disable automatic fade cycles"
        />
        
        {#if manualMode}
          <div class="flex gap-2">
            <Button variant="fade" on:click={handleFadeIn}>Fade In</Button>
            <Button variant="fade" on:click={handleFadeOut}>Fade Out</Button>
          </div>
        {/if}
        
        <Slider 
          label="Fade In Time" 
          bind:value={fadeInTime}
          min={0.5}
          max={10}
          step={0.1}
          unit="s"
          precision={1}
        />
        
        <Slider 
          label="Fade Out Time" 
          bind:value={fadeOutTime}
          min={0.5}
          max={10}
          step={0.1}
          unit="s"
          precision={1}
        />
        
        {#if !manualMode}
          <Slider 
            label="Visible Time" 
            bind:value={visibleTime}
            min={1}
            max={15}
            step={0.1}
            unit="s"
            precision={1}
          />
          
          <Slider 
            label="Pause Time" 
            bind:value={pauseTime}
            min={0.5}
            max={10}
            step={0.1}
            unit="s"
            precision={1}
          />
        {/if}
      </div>
    </div>
    
    <!-- Export & Recording Controls -->
    <div class="bg-white rounded-3xl p-4 mb-4 w-full">
      <h3 class="m-0 mb-4 text-lg font-bold text-gray-700 border-b border-gray-200 pb-2">Export & Recording</h3>
      <div class="flex flex-col gap-4">
        <Input 
          type="number"
          label="Export Resolution"
          bind:value={exportResolution}
          min={720}
          max={3840}
          step={1}
          tooltip="📝 Resolution in pixels (square format)"
        />
        
        <Checkbox 
          bind:checked={useHighResRecording}
          label="High-Resolution Recording"
          tooltip="📝 Uses higher quality rendering but may be slower"
        />
        
        <div class="flex gap-2 flex-wrap">
          <Button variant="primary" on:click={saveStill}>
            Save PNG
          </Button>
          
          <Button 
            variant="record" 
            recording={isRecording}
            on:click={toggleRecording}
          >
            {#if !isRecording}
              <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div> Record Video
            {:else}
              <span>⏹️ Stop Recording</span>
            {/if}
          </Button>
        </div>
        
        <RecordingIndicator {isRecording} {elapsedTime} size="md" />
      </div>
    </div>
    
    <!-- Background Media Controls -->
    <div class="bg-white rounded-3xl p-4 mb-4 w-full">
      <h3 class="m-0 mb-4 text-lg font-bold text-gray-700 border-b border-gray-200 pb-2">Background Media</h3>
      <div class="flex flex-col gap-4">
        <FileUpload
          label="Background Image/Video"
          description="Add a background image or video to your animation"
          maxSize={50}
          currentFile={currentBackgroundFile}
          on:upload={handleBackgroundUpload}
          on:remove={handleBackgroundRemove}
          on:error={handleBackgroundError}
        />
        
        {#if backgroundMedia}
          <Slider 
            label="Background Opacity" 
            bind:value={backgroundOpacity}
            min={0}
            max={1}
            step={0.01}
            precision={2}
            tooltip="📝 Adjust the opacity of the background media"
          />
          
          <Slider 
            label="Background Scale" 
            bind:value={backgroundScale}
            min={50}
            max={200}
            step={1}
            unit="%"
            precision={0}
            tooltip="📝 Scale the background media"
          />
          
          <Slider 
            label="Position X" 
            bind:value={backgroundPositionX}
            min={0}
            max={100}
            step={1}
            unit="%"
            precision={0}
            tooltip="📝 Horizontal position of the background"
          />
          
          <Slider 
            label="Position Y" 
            bind:value={backgroundPositionY}
            min={0}
            max={100}
            step={1}
            unit="%"
            precision={0}
            tooltip="📝 Vertical position of the background"
          />
          
          {#if backgroundMediaType === 'video'}
            <div class="flex justify-between items-center p-2 rounded-3xl bg-white">
              <span>Video Playback:</span>
              <Button variant="primary" on:click={toggleVideoPlayback}>
                {videoPlaybackLabel}
              </Button>
            </div>
          {/if}
        {/if}
      </div>
    </div>
    
    <div class="flex justify-center my-4">
      <Button rounded on:click={addCircle}>+</Button>
    </div>
    
          {#each circles as circle, i (i)}
        <div class="bg-white rounded-3xl p-4 mb-4 w-full">
          <h3 class="m-0 mb-4 text-lg font-bold text-gray-700 border-b border-gray-200 pb-2">Circle {i + 1}: {circle.text}</h3>
        <div class="flex flex-col gap-4">
          <Input 
            type="text"
            label="Text"
            bind:value={circle.text}
            placeholder="Enter circle text"
          />
          
          <Slider 
            label="Rotation Speed" 
            bind:value={circle.rotationSpeed}
            min={-2}
            max={2}
            step={0.01}
            precision={2}
          />
          
          <Slider 
            label="Rotation Start" 
            bind:value={circle.rotationStart}
            min={0}
            max={360}
            step={1}
            unit="°"
            precision={0}
          />
          
          <Slider 
            label="Letter Spacing Amplitude" 
            bind:value={circle.spacingAmplitudePercent}
            min={0}
            max={10}
            step={0.01}
            unit="%"
            precision={2}
          />
          
          <Slider 
            label="Letter Spacing Speed" 
            bind:value={circle.spacingSpeed}
            min={0}
            max={1}
            step={0.01}
            unit=" Hz"
            precision={2}
          />
          
          <Select 
            label="Animation Type"
            bind:value={circle.animationType}
            options={animationOptions}
            placeholder="Choose animation..."
          />
          
          {#if circles.length > 1}
            <div class="mt-4 flex justify-center">
              <Button variant="danger" size="sm" on:click={() => removeCircle(i)}>
                Remove Circle
              </Button>
            </div>
          {/if}
        </div>
      </div>
    {/each}
  {/if}
  </div>
</div>
