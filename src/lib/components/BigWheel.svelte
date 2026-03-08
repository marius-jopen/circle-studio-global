<script lang="ts">
  import TextCircle from './TextCircle.svelte';
  import RichTextInput from './RichTextInput.svelte';
  import { GIFEncoder, quantize, applyPalette } from 'gifenc';
  import { buildGifPalette } from '../utils/gifPalette';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { convertToMp4, preloadFFmpeg } from '../utils/convertToMp4';
  import {
    RecordingIndicator,
    FileUpload
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
      startInvisible?: boolean;
      fontFamily?: string;
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
    autoTextSize?: boolean;
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
  let manualMode = true;
  let triggerFadeIn = false;
  let triggerFadeOut = false;
  
  let circles: CircleConfig[] = [
    {
      text: 'ART CAMP EST.2016',
      rotationSpeed: 0.2,
      spacingAmplitudePercent: 0.8,
      spacingSpeed: 0.14,
      rotationStart: 0,
      animationType: 'sin',
    }
  ];

  // Animation type options for select component
  const animationOptions = [
    { value: 'sin', label: 'Sinusoidal' },
    { value: 'linear', label: 'Linear' },
    { value: 'ease-in', label: 'Ease In' },
    { value: 'ease-out', label: 'Ease Out' },
    { value: 'steps', label: 'Steps' }
  ];
  const baseContainerSize = 600;
  let exportResolution = 600; // Export width (height = width for square)
  let exportFps = 30; // Frame rate for video export
  let exportFormat = 'mp4'; // 'mp4' or 'gif'
  let containerElement: HTMLDivElement;
  let textCircleRefs: TextCircle[] = [];

  // Video recording variables
  let isRecording = false;
  let isConverting = false;
  let convertProgress = 0;
  let recorder: RecordRTCType | undefined;
  let recordingStream: MediaStream | undefined;
  let gifRecordingState: { gif: { writeFrame: (index: Uint8Array, w: number, h: number, opts?: { palette?: number[][]; delay?: number }) => void; finish: () => void; bytes: () => Uint8Array }; palette: number[][]; firstFrame: boolean; lastFrameTime: number } | null = null;
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
  $: activeStartInvisible = (showControls || (!items && !globalSettings))
    ? false
    : (globalSettings?.startInvisible ?? false);

  $: activePrimaryFontFamily = (showControls || (!items && !globalSettings))
    ? 'CircularXXWeb'
    : (globalSettings?.fontFamily ?? 'CircularXXWeb');

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
        autoTextSize: item.autoTextSize ?? false,
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
        text: 'art camp est.2016',
        rotationSpeed: -0.2,
        spacingAmplitudePercent: 0.8,
        spacingSpeed: 0.14,
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
      const exportFmt = exportFormat;
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
      
      if (exportFmt === 'gif') {
        // GIF: initialize encoder (frames added in captureFrame)
        const gif = GIFEncoder();
        gifRecordingState = { gif, palette: [], firstFrame: true, lastFrameTime: 0 };
      } else {
        // MP4: Set up stream and RecordRTC
        preloadFFmpeg();
        recordingStream = recordingCanvas.captureStream(exportFps);
        
        if (!recordingStream || recordingStream.getVideoTracks().length === 0) {
          console.error('Failed to create media stream from canvas');
          paused = wasAnimationPaused; // Restore original state
          return;
        }
        
        let bitrate = 8000000;
        if (activeExportResolution >= 1440) bitrate = 16000000;
        if (activeExportResolution >= 2160) bitrate = 30000000;
        
        const RecordRTCModule = await import('recordrtc');
        const RecordRTC = RecordRTCModule.default;
        // @ts-ignore
        recorder = new RecordRTC(recordingStream, {
          type: 'video',
          mimeType: 'video/mp4',
          frameRate: exportFps,
          quality: 1,
          width: activeExportResolution,
          height: activeExportResolution,
          videoBitsPerSecond: bitrate,
          frameInterval: 1,
          // @ts-ignore
          numberOfAudioChannels: 0,
          disableLogs: false,
          bitsPerSecond: bitrate,
          bufferSize: 16384
        });
        
        if (recorder) recorder.startRecording();
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
          
          // If GIF export, encode this frame (throttled to ~15fps for file size)
          if (gifRecordingState && renderContext) {
            const now = performance.now();
            const gifFps = Math.min(exportFps, 15);
            const minFrameDelay = 1000 / gifFps;
            if (now - gifRecordingState.lastFrameTime >= minFrameDelay) {
              gifRecordingState.lastFrameTime = now;
              const { gif } = gifRecordingState;
              const imgData = renderContext.getImageData(0, 0, activeExportResolution, activeExportResolution);
              const data = imgData.data;
              const isFirst = gifRecordingState.firstFrame;

              if (isFirst) {
                const basePalette = quantize(data, 250);
                gifRecordingState.palette = buildGifPalette(basePalette, {
                  textColor: activeTextColor,
                  backgroundColor: activeBackgroundColor !== 'transparent' ? activeBackgroundColor : undefined
                });
                gifRecordingState.firstFrame = false;
              }
              const index = applyPalette(data, gifRecordingState.palette);
              gif.writeFrame(index, activeExportResolution, activeExportResolution, {
                palette: isFirst ? gifRecordingState.palette : undefined,
                delay: Math.round(1000 / gifFps)
              });
            }
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
    if (!isRecording || !browser) return;
    
    const wasAnimationPaused = animationPaused;
    
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    try {
      if (gifRecordingState) {
        // GIF export
        const { gif } = gifRecordingState;
        gif.finish();
        const bytes = gif.bytes();
        const blob = new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `circle-studio-${getFormattedDateTime()}.gif`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
        gifRecordingState = null;
        isRecording = false;
        elapsedTime = 0;
        paused = wasAnimationPaused;
      } else if (recorder) {
        // MP4 export: record as WebM, then convert to H.264 MP4 for universal compatibility
        // (QuickTime, VLC, WhatsApp all require H.264 + yuv420p in MP4 container)
        recorder.stopRecording(async () => {
          const blob = recorder?.getBlob();
          if (!blob || blob.size < 1000) {
            console.error('Recording failed: Blob is too small or invalid', blob);
            alert('Recording failed. Please try again.');
            return;
          }
          isRecording = false;
          elapsedTime = 0;
          paused = wasAnimationPaused;
          if (recordingStream) {
            recordingStream.getTracks().forEach(track => track.stop());
          }

          // Convert to compatible MP4
          isConverting = true;
          convertProgress = 0;
          const mp4Blob = await convertToMp4(blob, (ratio) => {
            convertProgress = ratio;
          });
          isConverting = false;

          if (browser) {
            const url = URL.createObjectURL(mp4Blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `circle-studio-${getFormattedDateTime()}.mp4`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
          }
        });
      }
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



<div class="w-full">
	<div class="flex flex-col lg:flex-row gap-5 w-full max-w-7xl mx-auto"
		class:justify-center={!(showControls || (!items && !globalSettings))}
		class:items-center={!(showControls || (!items && !globalSettings))}>

		<!-- Controls Panel -->
		{#if showControls || (!items && !globalSettings)}
		<div class="flex-1 min-w-0 space-y-3">

			<!-- Circle Configs -->
			{#each circles as circle, i (i)}
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
					<h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Circle {i + 1}</h2>
					{#if circles.length > 1}
						<button class="text-xs text-red-400 hover:text-red-600 transition-colors" on:click={() => removeCircle(i)}>Remove</button>
					{/if}
				</div>
				<div class="p-4 space-y-3">
					<div>
						<label for="circle-text-{i}" class="block text-[11px] font-medium text-gray-500 mb-1">Text</label>
						<span class="block text-xs text-gray-400 mb-1">Select text, click B to bold</span>
						<RichTextInput id="circle-text-{i}" bind:value={circle.text} placeholder="Enter circle text" rows={1} />
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="rot-speed-{i}" class="block text-[11px] font-medium text-gray-500 mb-1">
								Rotation <span class="text-gray-400">{circle.rotationSpeed.toFixed(2)}</span>
							</label>
							<input id="rot-speed-{i}" type="range" min="-2" max="2" step="0.01" bind:value={circle.rotationSpeed} class="w-full h-1" />
						</div>
						<div>
							<label for="rot-start-{i}" class="block text-[11px] font-medium text-gray-500 mb-1">
								Start Angle <span class="text-gray-400">{circle.rotationStart}°</span>
							</label>
							<input id="rot-start-{i}" type="range" min="0" max="360" step="1" bind:value={circle.rotationStart} class="w-full h-1" />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="spacing-amp-{i}" class="block text-[11px] font-medium text-gray-500 mb-1">
								Spacing Amp <span class="text-gray-400">{circle.spacingAmplitudePercent.toFixed(2)}%</span>
							</label>
							<input id="spacing-amp-{i}" type="range" min="0" max="10" step="0.01" bind:value={circle.spacingAmplitudePercent} class="w-full h-1" />
						</div>
						<div>
							<label for="spacing-speed-{i}" class="block text-[11px] font-medium text-gray-500 mb-1">
								Spacing Speed <span class="text-gray-400">{circle.spacingSpeed.toFixed(2)} Hz</span>
							</label>
							<input id="spacing-speed-{i}" type="range" min="0" max="1" step="0.01" bind:value={circle.spacingSpeed} class="w-full h-1" />
						</div>
					</div>

					<div>
						<label for="anim-type-{i}" class="block text-[11px] font-medium text-gray-500 mb-1">Animation Type</label>
						<select id="anim-type-{i}" bind:value={circle.animationType}
							class="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors">
							{#each animationOptions as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
			{/each}

			<button class="w-full py-2 text-xs font-medium text-gray-500 bg-white rounded-xl border border-dashed border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
				on:click={addCircle}>
				+ Add Circle
			</button>

			<!-- Display Settings -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="px-4 py-2.5 border-b border-gray-100">
					<h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Display</h2>
				</div>
				<div class="p-4 space-y-3">
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="text-color" class="block text-[11px] font-medium text-gray-500 mb-1">Text Color</label>
							<div class="flex items-center gap-2">
								<input id="text-color" type="color" bind:value={textColor}
									class="w-7 h-7 rounded-md border border-gray-200 cursor-pointer p-0" />
								<span class="text-xs text-gray-400 font-mono">{textColor}</span>
							</div>
						</div>
						<div>
							<label for="bg-color" class="block text-[11px] font-medium text-gray-500 mb-1">Background</label>
							<div class="flex items-center gap-2">
								<input id="bg-color" type="color" bind:value={backgroundColor}
									class="w-7 h-7 rounded-md border border-gray-200 cursor-pointer p-0" />
								<span class="text-xs text-gray-400 font-mono">{backgroundColor}</span>
							</div>
						</div>
					</div>

					<label class="inline-flex items-center gap-1.5 cursor-pointer">
						<input type="checkbox" bind:checked={transparentBackground} class="w-3 h-3 rounded" />
						<span class="text-[11px] text-gray-500">Transparent Background</span>
					</label>

					<div class="border-t border-gray-100 pt-3">
						<label for="canvas-size" class="block text-[11px] font-medium text-gray-500 mb-1">
							Canvas Size <span class="text-gray-400">{Math.round((containerSizePercent / 100) * baseContainerSize)}px</span>
						</label>
						<input id="canvas-size" type="range" min="10" max="200" step="1" bind:value={containerSizePercent} class="w-full h-1" />
					</div>

					<div>
						<label for="font-size" class="block text-[11px] font-medium text-gray-500 mb-1">
							Font Size <span class="text-gray-400">{Math.round((fontSizePercent / 100) * containerSize)}px</span>
						</label>
						<input id="font-size" type="range" min="2" max="20" step="0.1" bind:value={fontSizePercent} class="w-full h-1" />
					</div>

					<div>
						<label for="circle-distance" class="block text-[11px] font-medium text-gray-500 mb-1">
							Circle Distance <span class="text-gray-400">{Math.round((distancePercent / 100) * containerSize)}px</span>
						</label>
						<input id="circle-distance" type="range" min="0" max="10" step="0.1" bind:value={distancePercent} class="w-full h-1" />
					</div>
				</div>
			</div>

			<!-- Export Settings -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="px-4 py-2.5 border-b border-gray-100">
					<h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Export</h2>
				</div>
				<div class="p-4 space-y-3">
					<div>
						<label for="export-format" class="block text-[11px] font-medium text-gray-500 mb-1">
							Format
						</label>
						<select id="export-format" value={exportFormat} on:change={(e) => { exportFormat = (e.currentTarget as HTMLSelectElement).value; }} class="w-full text-xs py-2 px-3 rounded-lg border border-gray-200 bg-white focus:ring-1 focus:ring-gray-300 focus:border-gray-300">
							<option value="mp4">MP4 (video)</option>
							<option value="gif">GIF (animated)</option>
						</select>
					</div>
					<div>
						<label for="export-res" class="block text-[11px] font-medium text-gray-500 mb-1">
							Width <span class="text-gray-400">{exportResolution}px</span>
						</label>
						<input id="export-res" type="range" min="720" max="3840" step="10" bind:value={exportResolution} class="w-full h-1" />
						<p class="text-[10px] text-gray-300 mt-0.5">Height auto ({exportResolution}px). Higher = better quality.</p>
					</div>
					<div>
						<label for="export-fps" class="block text-[11px] font-medium text-gray-500 mb-1">
							Frame Rate <span class="text-gray-400">{exportFps} fps</span>{#if exportFormat === 'gif'} <span class="text-gray-400">(capped 15 for GIF)</span>{/if}
						</label>
						<select id="export-fps" value={exportFps} on:change={(e) => { exportFps = Number((e.currentTarget as HTMLSelectElement).value); }} class="w-full text-xs py-2 px-3 rounded-lg border border-gray-200 bg-white focus:ring-1 focus:ring-gray-300 focus:border-gray-300">
							<option value={10}>10 fps</option>
							<option value={15}>15 fps</option>
							<option value={24}>24 fps</option>
							<option value={30}>30 fps</option>
							<option value={60}>60 fps</option>
						</select>
						<p class="text-[10px] text-gray-300 mt-0.5">Higher fps = smoother video, larger file.</p>
					</div>
					<label class="inline-flex items-center gap-1.5 cursor-pointer">
						<input type="checkbox" bind:checked={useHighResRecording} class="w-3 h-3 rounded" />
						<span class="text-[11px] text-gray-500">High-Res Recording</span>
					</label>
				</div>
			</div>

			<!-- Animation Settings -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="px-4 py-2.5 border-b border-gray-100">
					<h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Animation</h2>
				</div>
				<div class="p-4 space-y-3">
					<label class="inline-flex items-center gap-1.5 cursor-pointer">
						<input type="checkbox" bind:checked={manualMode} class="w-3 h-3 rounded" />
						<span class="text-[11px] text-gray-500">Manual Mode</span>
					</label>

					{#if manualMode}
						<div class="flex gap-2">
							<button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
								on:click={handleFadeIn}>Fade In</button>
							<button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
								on:click={handleFadeOut}>Fade Out</button>
						</div>
					{/if}

					<div class="grid grid-cols-2 gap-x-4 gap-y-3">
						<div>
							<label for="fade-in" class="block text-[11px] font-medium text-gray-500 mb-1">
								Fade In <span class="text-gray-400">{fadeInTime.toFixed(1)}s</span>
							</label>
							<input id="fade-in" type="range" min="0.5" max="10" step="0.1" bind:value={fadeInTime} class="w-full h-1" />
						</div>
						<div>
							<label for="fade-out" class="block text-[11px] font-medium text-gray-500 mb-1">
								Fade Out <span class="text-gray-400">{fadeOutTime.toFixed(1)}s</span>
							</label>
							<input id="fade-out" type="range" min="0.5" max="10" step="0.1" bind:value={fadeOutTime} class="w-full h-1" />
						</div>
					</div>

					{#if !manualMode}
						<div class="grid grid-cols-2 gap-x-4 gap-y-3">
							<div>
								<label for="visible-time" class="block text-[11px] font-medium text-gray-500 mb-1">
									Visible <span class="text-gray-400">{visibleTime.toFixed(1)}s</span>
								</label>
								<input id="visible-time" type="range" min="1" max="15" step="0.1" bind:value={visibleTime} class="w-full h-1" />
							</div>
							<div>
								<label for="pause-time" class="block text-[11px] font-medium text-gray-500 mb-1">
									Pause <span class="text-gray-400">{pauseTime.toFixed(1)}s</span>
								</label>
								<input id="pause-time" type="range" min="0.5" max="10" step="0.1" bind:value={pauseTime} class="w-full h-1" />
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Background Media -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="px-4 py-2.5 border-b border-gray-100">
					<h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Background</h2>
				</div>
				<div class="p-4 space-y-3">
					<FileUpload
						label="Background Image/Video"
						description="Add a background image or video"
						maxSize={50}
						currentFile={currentBackgroundFile}
						on:upload={handleBackgroundUpload}
						on:remove={handleBackgroundRemove}
						on:error={handleBackgroundError}
					/>

					{#if backgroundMedia}
						<div class="grid grid-cols-2 gap-x-4 gap-y-3">
							<div>
								<label for="bg-opacity" class="block text-[11px] font-medium text-gray-500 mb-1">
									Opacity <span class="text-gray-400">{backgroundOpacity.toFixed(2)}</span>
								</label>
								<input id="bg-opacity" type="range" min="0" max="1" step="0.01" bind:value={backgroundOpacity} class="w-full h-1" />
							</div>
							<div>
								<label for="bg-scale" class="block text-[11px] font-medium text-gray-500 mb-1">
									Scale <span class="text-gray-400">{backgroundScale}%</span>
								</label>
								<input id="bg-scale" type="range" min="50" max="200" step="1" bind:value={backgroundScale} class="w-full h-1" />
							</div>
							<div>
								<label for="bg-pos-x" class="block text-[11px] font-medium text-gray-500 mb-1">
									Position X <span class="text-gray-400">{backgroundPositionX}%</span>
								</label>
								<input id="bg-pos-x" type="range" min="0" max="100" step="1" bind:value={backgroundPositionX} class="w-full h-1" />
							</div>
							<div>
								<label for="bg-pos-y" class="block text-[11px] font-medium text-gray-500 mb-1">
									Position Y <span class="text-gray-400">{backgroundPositionY}%</span>
								</label>
								<input id="bg-pos-y" type="range" min="0" max="100" step="1" bind:value={backgroundPositionY} class="w-full h-1" />
							</div>
						</div>

						{#if backgroundMediaType === 'video'}
							<button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
								on:click={toggleVideoPlayback}>
								{videoPlaybackLabel}
							</button>
						{/if}
					{/if}
				</div>
			</div>
		</div>
		{/if}

		<!-- Canvas & Controls -->
		<div class="flex-shrink-0 lg:sticky lg:top-5 lg:self-start">
			<div
				class="relative rounded-2xl overflow-hidden mx-auto"
				style="width: {containerSize}px; height: {containerSize}px; {activeBackgroundColor !== 'transparent' ? `background-color: ${activeBackgroundColor};` : ''}"
				bind:this={containerElement}
			>
				{#if backgroundMedia && currentBackgroundFile}
					<div class="absolute inset-0 flex items-center justify-center" style="opacity: {backgroundOpacity};">
						{#if backgroundMediaType === 'image'}
							<img src={currentBackgroundFile.url} alt="Background" class="w-full h-full object-cover"
								style="transform: scale({backgroundScale / 100}) translate({(backgroundPositionX - 50) * 2}%, {(backgroundPositionY - 50) * 2}%);" />
						{:else if backgroundMediaType === 'video'}
							<video src={currentBackgroundFile.url} class="w-full h-full object-cover"
								style="transform: scale({backgroundScale / 100}) translate({(backgroundPositionX - 50) * 2}%, {(backgroundPositionY - 50) * 2}%);"
								autoplay loop muted>
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
							primaryFontFamily={activePrimaryFontFamily}
							fadeInTime={activeFadeInTime}
							fadeOutTime={activeFadeOutTime}
							pauseTime={activePauseTime}
							visibleTime={activeVisibleTime}
							manualMode={activeManualMode}
							triggerFadeIn={activeTriggerFadeIn}
							triggerFadeOut={activeTriggerFadeOut}
							startInvisible={activeStartInvisible}
							autoTextSize={circle.autoTextSize ?? false}
							bind:this={textCircleRefs[i]}
						/>
					</div>
				{/each}
			</div>

			{#if showControls || (!items && !globalSettings)}
			<!-- Toolbar -->
			<div class="mt-3 flex items-center justify-center gap-2">
				<button
					class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
						{isRecording ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}
						{isConverting ? 'opacity-40 cursor-not-allowed' : ''}"
					on:click={toggleRecording}
					disabled={isConverting}
				>
					{#if !isRecording}
						<span class="w-2 h-2 bg-red-500 rounded-full"></span> Record
					{:else}
						<span class="w-2 h-2 bg-white rounded-sm"></span> Stop
					{/if}
				</button>

				<button
					class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
					on:click={saveStill}
				>
					Save PNG
				</button>

				<button
					class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
					on:click={() => paused = !paused}
				>
					{paused ? 'Resume' : 'Pause'}
				</button>
			</div>

			{#if isRecording}
				<div class="mt-2 flex justify-center">
					<RecordingIndicator {isRecording} {elapsedTime} size="md" />
				</div>
			{/if}

			{#if isConverting}
				<div class="mt-2 flex flex-col items-center gap-1.5">
					<p class="text-xs text-blue-600 font-medium">Converting to MP4... {Math.round(convertProgress * 100)}%</p>
					<div class="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
						<div class="h-full bg-blue-500 rounded-full transition-all duration-300" style="width: {convertProgress * 100}%"></div>
					</div>
				</div>
			{/if}

			<p class="mt-2 text-[10px] text-gray-300 text-center max-w-sm mx-auto leading-relaxed">
				Recording runs in-browser. Close other tabs for best performance.
			</p>
			{/if}
		</div>
	</div>

	<!-- Recording Warning Banner -->
	{#if isRecording}
		<div class="fixed top-3 left-1/2 transform -translate-x-1/2 z-50 max-w-lg w-full px-4">
			<div class="bg-amber-50 border border-amber-300 rounded-xl shadow-lg px-4 py-3">
				<div class="flex items-center gap-2.5">
					<span class="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"></span>
					<p class="text-xs text-amber-800">
						<strong>Recording</strong> — Don't touch, scroll, or switch tabs. Stops automatically.
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
