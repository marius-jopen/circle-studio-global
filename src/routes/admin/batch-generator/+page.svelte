<script lang="ts">
	import TextCircle from '$lib/components/TextCircle.svelte';
	import RichTextInput from '$lib/components/RichTextInput.svelte';
	import { Input, Button, RecordingIndicator, FileUpload } from '$lib/primitives';
	import { parseBoldText, boldTextToHtml } from '$lib/utils/boldText';
	import { GIFEncoder, quantize, applyPalette } from 'gifenc';
	import { buildGifPalette } from '$lib/utils/gifPalette';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Form fields
	let hello = $state('Dear');
	let name = $state('Peter');
	let content = $state(`Learn to observe snails and plant impossible gardens. 
Invite someone dangerous to tea.`);
	let goodbye = $state('Love, Santi');
	let branding = $state('Art-Camp, 2026');

	// Animation state
	let currentPhase = $state<'greeting' | 'content' | 'goodbye'>('greeting');
	let displayText = $state('');
	let isPlaying = $state(false);
	let typewriterTimeout: ReturnType<typeof setTimeout> | null = null;

	// Typewriter settings
	let typewriterSpeed = $state(150); // milliseconds per character (typing)
	let deleteSpeed = $state(50); // milliseconds per character (deleting - faster)
	let chapterPause = $state(100); // milliseconds to pause between chapters
	let speedVariation = $state(25); // percentage variation in typing speed (0-100)
	let visibleDuration = $state(350); // milliseconds to keep chapter visible before deleting
	let goodbyePause = $state(800); // milliseconds to pause between goodbye and branding
	let delayBeforeAfter = $state(300); // milliseconds to pause before animation starts and after it finishes
	let instantClear = $state(true); // When true, text clears instantly instead of deleting letter by letter

	// TextCircle props
	let textColor = $state('#000000');
	let backgroundColor = $state('#ffffff');
	let containerSize = $state(600);
	let fontSize = $state(40);
	let rotationSpeed = $state(0.2);
	let paused = $state(false);
	let dynamicTextSize = $state(true); // Auto-adjust font size to fill circumference
	let inputFieldVisible = $state(true); // Show input field and use portrait format
	let recordingWidth = $state(1080); // Recording width in pixels
	let recordingFps = $state(30); // Frame rate for export (15, 24, 30, 60)
	let exportFormat = $state<'mp4' | 'gif'>('mp4');
	let inputFieldRef = $state<HTMLDivElement | null>(null);
	let containerRef = $state<HTMLDivElement | null>(null); // Reference to the container to record
	let textCircleRef = $state<any>(null); // Reference to TextCircle component

	// Background media (image/video)
	let backgroundMedia = $state<HTMLImageElement | HTMLVideoElement | null>(null);
	let backgroundMediaType = $state<'image' | 'video' | null>(null);
	let currentBackgroundFile = $state<{ name: string; type: string; url: string } | null>(null);
	let backgroundOpacity = $state(1);
	let backgroundScale = $state(100);
	let backgroundPositionX = $state(50);
	let backgroundPositionY = $state(50);

	// Recording state
	let isRecording = $state(false);
	let recorder: any = null;
	let recordingStream: MediaStream | null = null;
	let gifRecordingState: { gif: { writeFrame: (index: Uint8Array, w: number, h: number, opts?: { palette?: number[][]; delay?: number }) => void; finish: () => void; bytes: () => Uint8Array }; palette: number[][]; firstFrame: boolean } | null = null;
	let elapsedTime = $state(0);
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let recordingCanvas: HTMLCanvasElement | null = null;
	let recordingContext: CanvasRenderingContext2D | null = null;

	// Auto-scroll input field to the right when text changes
	$effect(() => {
		if (inputFieldRef && displayText) {
			// Use setTimeout to ensure DOM has updated before scrolling
			setTimeout(() => {
				if (inputFieldRef) {
					inputFieldRef.scrollLeft = inputFieldRef.scrollWidth;
				}
			}, 0);
		}
	});

	// Calculate container dimensions based on input field visibility
	let containerWidth = $derived(inputFieldVisible ? 600 : containerSize);
	let containerHeight = $derived(inputFieldVisible ? 750 : containerSize); // 4:5 ratio (600 * 1.25 = 750)

	// Get full text for current phase
	function getFullTextForPhase(phase: 'greeting' | 'content' | 'goodbye'): string {
		if (phase === 'greeting') {
			return name.trim() ? `${hello} ${name},` : hello;
		} else if (phase === 'content') {
			return content || '';
		} else if (phase === 'goodbye') {
			// Goodbye phase combines goodbye and branding
			return `${goodbye} ${branding}`;
		}
		return '';
	}

	// Get content lines (split by newline)
	function getContentLines(): string[] {
		return content.split('\n').filter(line => line.trim().length > 0);
	}

	// Get varied speed with random variation
	function getVariedSpeed(baseSpeed: number, variationPercent: number): number {
		const variation = (baseSpeed * variationPercent) / 100;
		const min = baseSpeed - variation;
		const max = baseSpeed + variation;
		return min + Math.random() * (max - min);
	}

	// Calculate word count in text
	function getWordCount(text: string): number {
		return text.trim().split(/\s+/).filter(word => word.length > 0).length;
	}

	// Calculate visible duration based on word count
	function getVisibleDurationForText(text: string, phase?: 'greeting' | 'content' | 'goodbye'): number {
		const wordCount = getWordCount(text);
		// Base duration per word, so longer texts stay visible longer
		let duration = visibleDuration * wordCount;
		// Goodbye chapter lasts 3 times longer
		if (phase === 'goodbye') {
			duration = duration * 3;
		}
		return duration;
	}

	// Backspace effect - deletes text character by character (backwards)
	function deleteText(currentText: string, onComplete: () => void) {
		if (instantClear) {
			displayText = '';
			if (isPlaying) {
				onComplete();
			}
			return;
		}

		let currentIndex = currentText.length;

		function deleteNextCharacter() {
			if (!isPlaying) {
				return;
			}

			if (currentIndex > 0) {
				displayText = currentText.slice(0, currentIndex - 1);
				currentIndex--;
				const variedSpeed = getVariedSpeed(deleteSpeed, speedVariation);
				typewriterTimeout = setTimeout(deleteNextCharacter, variedSpeed);
			} else {
				displayText = '';
				if (isPlaying) {
					onComplete();
				}
			}
		}

		deleteNextCharacter();
	}

	// Typewriter effect - types out text character by character
	function typeText(fullText: string, onComplete: () => void, phase?: 'greeting' | 'content' | 'goodbye', prefixText: string = '') {
		let currentIndex = 0;
		displayText = prefixText; // Start with prefix text if provided (for branding after goodbye)

		function typeNextCharacter() {
			if (!isPlaying) {
				return;
			}

			if (currentIndex < fullText.length) {
				const currentText = fullText.slice(0, currentIndex + 1);
				displayText = prefixText + currentText; // Combine prefix with current text
				currentIndex++;
				const variedSpeed = getVariedSpeed(typewriterSpeed, speedVariation);
				typewriterTimeout = setTimeout(typeNextCharacter, variedSpeed);
			} else {
				// Typing complete, wait for visible duration (based on word count) then delete and move to next phase
				const durationForThisText = getVisibleDurationForText(fullText, phase);
				setTimeout(() => {
					if (isPlaying) {
						onComplete();
					}
				}, durationForThisText);
			}
		}

		typeNextCharacter();
	}

	// Typewriter effect that calls onComplete immediately after typing (no visible duration wait)
	function typeTextImmediate(fullText: string, onComplete: () => void, prefixText: string = '') {
		let currentIndex = 0;
		displayText = prefixText; // Start with prefix text if provided

		function typeNextCharacter() {
			if (!isPlaying) {
				return;
			}

			if (currentIndex < fullText.length) {
				const currentText = fullText.slice(0, currentIndex + 1);
				displayText = prefixText + currentText; // Combine prefix with current text
				currentIndex++;
				const variedSpeed = getVariedSpeed(typewriterSpeed, speedVariation);
				typewriterTimeout = setTimeout(typeNextCharacter, variedSpeed);
			} else {
				// Typing complete, call onComplete immediately
				if (isPlaying) {
					onComplete();
				}
			}
		}

		typeNextCharacter();
	}

	// Start the animation sequence
	function startAnimation() {
		if (isPlaying) return;
		
		isPlaying = true;
		currentPhase = 'greeting';
		
		// Wait for delay before starting
		setTimeout(() => {
			if (!isPlaying) return;
			
			// Start typing greeting
			typeText(getFullTextForPhase('greeting'), () => {
				// Greeting complete, delete it then move to content lines
				deleteText(displayText, () => {
					// Process each content line as a separate chapter
					processContentLines(0);
				});
			}, 'greeting');
		}, delayBeforeAfter);
	}

	// Process content lines one by one
	function processContentLines(lineIndex: number) {
		const contentLines = getContentLines();
		
			if (lineIndex >= contentLines.length) {
				// All content lines done, move to goodbye
				const variedPause = getVariedSpeed(chapterPause, speedVariation);
				setTimeout(() => {
					if (isPlaying) {
						currentPhase = 'goodbye';
						// Type goodbye first (without waiting for visible duration - we'll wait after branding)
						typeTextImmediate(goodbye, () => {
							// Pause between goodbye and branding
							const variedPause = getVariedSpeed(goodbyePause, speedVariation);
							setTimeout(() => {
								if (isPlaying) {
									// Then type branding (append to existing goodbye text with a space)
									const currentGoodbyeText = displayText + ' ';
									typeText(branding, () => {
										// Goodbye complete (both parts), delete it then finish
										deleteText(displayText, () => {
											// All done
											currentPhase = 'greeting';
											displayText = '';
											
											// Wait for delay after animation
											setTimeout(() => {
												if (isRecording) {
													// Stop recording and animation when recording
													isPlaying = false;
													stopRecording();
												} else {
													// Loop the animation for preview
													if (isPlaying && !paused) {
														startAnimation();
													} else {
														isPlaying = false;
													}
												}
											}, delayBeforeAfter);
										});
									}, 'goodbye', currentGoodbyeText);
								}
							}, variedPause);
						});
					}
				}, variedPause);
			return;
		}

		// Pause between chapters (with variation)
		const variedPause = getVariedSpeed(chapterPause, speedVariation);
		setTimeout(() => {
			if (!isPlaying) return;
			
			currentPhase = 'content';
			const lineText = contentLines[lineIndex];
			
			// Type this line
			typeText(lineText, () => {
				// Line complete, delete it then move to next line
				deleteText(displayText, () => {
					// Process next line
					processContentLines(lineIndex + 1);
				});
			}, 'content');
		}, variedPause);
	}

	function stopAnimation() {
		isPlaying = false;
		if (typewriterTimeout) {
			clearTimeout(typewriterTimeout);
			typewriterTimeout = null;
		}
		currentPhase = 'greeting';
		displayText = '';
	}

	function resetAnimation() {
		stopAnimation();
	}

	function restartAnimation() {
		stopAnimation();
		// Small delay to ensure clean reset
		setTimeout(() => {
			startAnimation();
		}, 100);
	}

	function togglePause() {
		paused = !paused;
		if (paused) {
			// Pause the typewriter animation by stopping timeouts
			if (typewriterTimeout) {
				clearTimeout(typewriterTimeout);
				typewriterTimeout = null;
			}
		} else {
			// Resume: restart the current phase from the beginning
			if (isPlaying) {
				// Clear current display and restart current phase
				const phase = currentPhase;
				displayText = '';
				if (phase === 'greeting') {
					typeText(getFullTextForPhase('greeting'), () => {
						deleteText(displayText, () => {
							processContentLines(0);
						});
					}, 'greeting');
				} else if (phase === 'content') {
					processContentLines(0);
				} else if (phase === 'goodbye') {
					typeTextImmediate(goodbye, () => {
						const variedPause = getVariedSpeed(goodbyePause, speedVariation);
						setTimeout(() => {
							if (isPlaying && !paused) {
								const currentGoodbyeText = displayText + ' ';
								typeText(branding, () => {
									deleteText(displayText, () => {
										isPlaying = false;
										currentPhase = 'greeting';
										displayText = '';
									});
								}, 'goodbye', currentGoodbyeText);
							}
						}, variedPause);
					});
				}
			} else {
				// If not playing, start from beginning
				startAnimation();
			}
		}
	}

	// Background media handlers
	function handleBackgroundUpload(e: CustomEvent<{ file: File; url: string; type: 'image' | 'video' }>) {
		const { file, url, type } = e.detail;
		if (currentBackgroundFile) URL.revokeObjectURL(currentBackgroundFile.url);
		currentBackgroundFile = { name: file.name, type: file.type, url };
		backgroundMediaType = type;
		if (type === 'image') {
			const img = new Image();
			img.onload = () => { backgroundMedia = img; };
			img.src = url;
		} else {
			const video = document.createElement('video');
			video.loop = true;
			video.muted = true;
			video.onloadeddata = () => { backgroundMedia = video; video.play(); };
			video.src = url;
		}
	}
	function handleBackgroundRemove() {
		if (currentBackgroundFile) URL.revokeObjectURL(currentBackgroundFile.url);
		backgroundMedia = null;
		backgroundMediaType = null;
		currentBackgroundFile = null;
	}
	function handleBackgroundError(e: CustomEvent<{ message: string }>) {
		if (browser) alert(e.detail.message);
	}

	// Recording functions
	async function startRecording() {
		if (isRecording || !textCircleRef || !browser) return;

		// Completely reset animation state FIRST - before any recording setup
		stopAnimation();
		displayText = ''; // Clear any leftover text
		currentPhase = 'greeting'; // Reset to initial phase
		isPlaying = false;
		
		// Wait for reset to complete and ensure state is cleared
		await new Promise(resolve => setTimeout(resolve, 200));
		
		// Double-check everything is reset
		displayText = '';
		currentPhase = 'greeting';
		isPlaying = false;
		
		// Ensure animation is not paused
		paused = false;

		try {
			const exportFmt = exportFormat;

			// Determine recording dimensions based on inputFieldVisible and recordingWidth setting
			let recordingHeight: number;
			let circleAreaHeight: number;
			let inputFieldAreaHeight: number;
			
			if (inputFieldVisible) {
				// 4:5 portrait format
				recordingHeight = recordingWidth * 1.25; // 4:5 aspect ratio
				circleAreaHeight = recordingWidth; // Circle takes up the width
				inputFieldAreaHeight = recordingHeight - recordingWidth; // Input field area at bottom
			} else {
				// Square format
				recordingHeight = recordingWidth;
				circleAreaHeight = recordingWidth;
				inputFieldAreaHeight = 0;
			}

			// Create canvas for recording
			recordingCanvas = document.createElement('canvas');
			recordingCanvas.width = recordingWidth;
			recordingCanvas.height = recordingHeight;
			recordingContext = recordingCanvas.getContext('2d', { alpha: backgroundColor === 'transparent' });

			if (!recordingContext) {
				console.error('Failed to get canvas context for recording');
				return;
			}

			// Clear the canvas completely to remove any previous recording artifacts
			recordingContext.clearRect(0, 0, recordingCanvas.width, recordingCanvas.height);

			// Set high quality rendering
			recordingContext.imageSmoothingEnabled = true;
			recordingContext.imageSmoothingQuality = 'high';

			if (exportFmt === 'gif') {
				// GIF: initialize encoder (frames added in captureFrame)
				const gif = GIFEncoder();
				gifRecordingState = { gif, palette: [], firstFrame: true };
			} else {
				// MP4: Create stream from canvas
				recordingStream = recordingCanvas.captureStream(recordingFps);

				if (!recordingStream || recordingStream.getVideoTracks().length === 0) {
					console.error('Failed to create media stream from canvas');
					return;
				}

				// Calculate bitrate
				let bitrate = 8000000; // 8Mbps base
				if (recordingWidth >= 1440) bitrate = 16000000; // 16Mbps for larger
				if (recordingWidth >= 2160) bitrate = 30000000; // 30Mbps for 4K

				// Initialize RecordRTC
				const RecordRTCModule = await import('recordrtc');
				const RecordRTC = RecordRTCModule.default;
				// @ts-ignore
				recorder = new RecordRTC(recordingStream, {
					type: 'video',
					mimeType: 'video/mp4',
					frameRate: recordingFps,
					quality: 1,
					width: recordingWidth,
					height: recordingHeight,
					videoBitsPerSecond: bitrate,
					frameInterval: 1,
					// @ts-ignore
					numberOfAudioChannels: 0,
					disableLogs: false,
					bitsPerSecond: bitrate,
					bufferSize: 16384
				});
			}

			// Ensure video background plays during recording
			if (backgroundMedia && backgroundMediaType === 'video') {
				(backgroundMedia as HTMLVideoElement).play().catch(() => {});
			}
			// Draw blank frame first to ensure clean start
			recordingContext.clearRect(0, 0, recordingCanvas.width, recordingCanvas.height);
			if (backgroundColor !== 'transparent') {
				recordingContext.fillStyle = backgroundColor;
				recordingContext.fillRect(0, 0, recordingWidth, recordingHeight);
			}
			// Draw background media if present (cover mode - fill area, maintain aspect ratio)
			if (backgroundMedia && currentBackgroundFile) {
				recordingContext.save();
				recordingContext.globalAlpha = backgroundOpacity;
				const mw = backgroundMedia instanceof HTMLImageElement ? backgroundMedia.naturalWidth : (backgroundMedia as HTMLVideoElement).videoWidth;
				const mh = backgroundMedia instanceof HTMLImageElement ? backgroundMedia.naturalHeight : (backgroundMedia as HTMLVideoElement).videoHeight;
				if (mw > 0 && mh > 0) {
					const coverScale = Math.max(recordingWidth / mw, recordingHeight / mh) * (backgroundScale / 100);
					const drawW = mw * coverScale, drawH = mh * coverScale;
					const dx = (recordingWidth - drawW) * (backgroundPositionX / 100);
					const dy = (recordingHeight - drawH) * (backgroundPositionY / 100);
					recordingContext.drawImage(backgroundMedia, 0, 0, mw, mh, dx, dy, drawW, drawH);
				}
				recordingContext.restore();
			}
			// Draw empty input field if visible (pixel-aligned)
			if (inputFieldVisible) {
				const inputFieldY = Math.round(circleAreaHeight + (inputFieldAreaHeight / 2) + (15 * (recordingWidth / 600)));
				const inputFieldWidth = Math.round(recordingWidth * 0.67);
				const inputFieldX = Math.round((recordingWidth - inputFieldWidth) / 2);
				const inputFieldHeight = Math.round(56 * (recordingWidth / 600));
				const borderRadius = Math.round(inputFieldHeight / 2);
				recordingContext.fillStyle = '#f3f4f6';
				recordingContext.beginPath();
				recordingContext.moveTo(inputFieldX + borderRadius, inputFieldY - inputFieldHeight / 2);
				recordingContext.lineTo(inputFieldX + inputFieldWidth - borderRadius, inputFieldY - inputFieldHeight / 2);
				recordingContext.arc(inputFieldX + inputFieldWidth - borderRadius, inputFieldY - inputFieldHeight / 2 + borderRadius, borderRadius, -Math.PI / 2, 0);
				recordingContext.lineTo(inputFieldX + inputFieldWidth, inputFieldY + inputFieldHeight / 2 - borderRadius);
				recordingContext.arc(inputFieldX + inputFieldWidth - borderRadius, inputFieldY + inputFieldHeight / 2 - borderRadius, borderRadius, 0, Math.PI / 2);
				recordingContext.lineTo(inputFieldX + borderRadius, inputFieldY + inputFieldHeight / 2);
				recordingContext.arc(inputFieldX + borderRadius, inputFieldY + inputFieldHeight / 2 - borderRadius, borderRadius, Math.PI / 2, Math.PI);
				recordingContext.lineTo(inputFieldX, inputFieldY - inputFieldHeight / 2 + borderRadius);
				recordingContext.arc(inputFieldX + borderRadius, inputFieldY - inputFieldHeight / 2 + borderRadius, borderRadius, Math.PI, -Math.PI / 2);
				recordingContext.closePath();
				recordingContext.fill();
			}

			// Don't start MP4 recorder yet - wait for first frame to be drawn (avoids black first frame)
			isRecording = true;
			elapsedTime = 0;
			let recorderStarted = false;
			let frameIndex = 0;

			// Start timer
			timerInterval = setInterval(() => {
				elapsedTime++;
			}, 1000);

			// Wait a moment before starting animation to ensure first frames are blank
			setTimeout(() => {
				startAnimation();
			}, 200);

			// Capture frames at the correct FPS using setTimeout for consistent timing
			const frameInterval = 1000 / recordingFps; // milliseconds per frame

			const captureFrame = () => {
				if (!isRecording || !recordingContext || !recordingCanvas || !textCircleRef) {
					return;
				}

				try {
					// Ensure animation is not paused
					paused = false;

					// Always clear the canvas first to remove any previous frame artifacts
					recordingContext.clearRect(0, 0, recordingCanvas.width, recordingCanvas.height);

					// Draw background (to avoid white flash)
					if (backgroundColor !== 'transparent') {
						recordingContext.fillStyle = backgroundColor;
						recordingContext.fillRect(0, 0, recordingWidth, recordingHeight);
					}
					// Draw background media if present (cover mode - fill area, maintain aspect ratio)
					if (backgroundMedia && currentBackgroundFile) {
						recordingContext.save();
						recordingContext.globalAlpha = backgroundOpacity;
						const mw = backgroundMedia instanceof HTMLImageElement ? backgroundMedia.naturalWidth : (backgroundMedia as HTMLVideoElement).videoWidth;
						const mh = backgroundMedia instanceof HTMLImageElement ? backgroundMedia.naturalHeight : (backgroundMedia as HTMLVideoElement).videoHeight;
						if (mw > 0 && mh > 0) {
							const coverScale = Math.max(recordingWidth / mw, recordingHeight / mh) * (backgroundScale / 100);
							const drawW = mw * coverScale, drawH = mh * coverScale;
							const dx = (recordingWidth - drawW) * (backgroundPositionX / 100);
							const dy = (recordingHeight - drawH) * (backgroundPositionY / 100);
							recordingContext.drawImage(backgroundMedia, 0, 0, mw, mh, dx, dy, drawW, drawH);
						}
						recordingContext.restore();
					}

					// Only draw circle if there's text to display (avoid drawing old text)
					if (displayText && displayText.length > 0) {
						// Prefer the live TextCircle canvas to avoid re-render flicker; fallback to captureCanvas
						const circleCanvas = (textCircleRef.getCanvas && textCircleRef.getCanvas()) || textCircleRef.captureCanvas(false);
						if (circleCanvas && circleCanvas.width > 0 && circleCanvas.height > 0) {
							// The container size is based on recordingWidth setting
							const actualContainerSize = recordingWidth;
							const scaleFactor = recordingWidth / actualContainerSize; // Should be 1.0
							
							// Scale down the circle by 7% in video to add more padding from border
							const circleScale = 0.93;
							const scaledSize = actualContainerSize * circleScale;
							
							// Draw the circle canvas centered in the circle area (scaled down)
							// Move down by 20px when input field is visible for better vertical centering (scaled proportionally)
							const circleX = (recordingWidth - scaledSize * scaleFactor) / 2;
							const circleYOffset = inputFieldVisible ? 20 * (recordingWidth / 600) : 0; // Scale from base 600px
							const circleY = (circleAreaHeight - scaledSize * scaleFactor) / 2 + circleYOffset;
							
							recordingContext.save();
							recordingContext.translate(circleX + (scaledSize * scaleFactor) / 2, circleY + (scaledSize * scaleFactor) / 2);
							recordingContext.scale(scaleFactor * circleScale, scaleFactor * circleScale);
							recordingContext.drawImage(circleCanvas, -actualContainerSize / 2, -actualContainerSize / 2, actualContainerSize, actualContainerSize);
							recordingContext.restore();
						}
					}

					// Draw input field if visible (pixel-aligned for crisp output, no flashing)
					if (inputFieldVisible && displayText !== undefined) {
						const inputFieldYOffset = Math.round(15 * (recordingWidth / 600));
						const inputFieldY = Math.round(circleAreaHeight + (inputFieldAreaHeight / 2) + inputFieldYOffset);
						const inputFieldWidth = Math.round(recordingWidth * 0.67);
						const inputFieldX = Math.round((recordingWidth - inputFieldWidth) / 2);
						const inputFieldHeight = Math.round(56 * (recordingWidth / 600));
						const borderRadius = Math.round(inputFieldHeight / 2);
						
						// Draw input field background (gray-100) with rounded corners
						recordingContext.fillStyle = '#f3f4f6'; // gray-100
						recordingContext.beginPath();
						// Draw rounded rectangle manually for compatibility
						recordingContext.moveTo(inputFieldX + borderRadius, inputFieldY - inputFieldHeight / 2);
						recordingContext.lineTo(inputFieldX + inputFieldWidth - borderRadius, inputFieldY - inputFieldHeight / 2);
						recordingContext.arc(inputFieldX + inputFieldWidth - borderRadius, inputFieldY - inputFieldHeight / 2 + borderRadius, borderRadius, -Math.PI / 2, 0);
						recordingContext.lineTo(inputFieldX + inputFieldWidth, inputFieldY + inputFieldHeight / 2 - borderRadius);
						recordingContext.arc(inputFieldX + inputFieldWidth - borderRadius, inputFieldY + inputFieldHeight / 2 - borderRadius, borderRadius, 0, Math.PI / 2);
						recordingContext.lineTo(inputFieldX + borderRadius, inputFieldY + inputFieldHeight / 2);
						recordingContext.arc(inputFieldX + borderRadius, inputFieldY + inputFieldHeight / 2 - borderRadius, borderRadius, Math.PI / 2, Math.PI);
						recordingContext.lineTo(inputFieldX, inputFieldY - inputFieldHeight / 2 + borderRadius);
						recordingContext.arc(inputFieldX + borderRadius, inputFieldY - inputFieldHeight / 2 + borderRadius, borderRadius, Math.PI, -Math.PI / 2);
						recordingContext.closePath();
						recordingContext.fill();

						// Draw text - pixel-aligned, always keep left padding (never float text to left edge)
						const padding = Math.round(24 * (recordingWidth / 600));
						const minLeftPadding = padding; // Always reserve left padding when text overflows
						const fontSize = Math.round(28 * (recordingWidth / 600));
						const maxTextWidth = inputFieldWidth - (padding * 2);
						
						recordingContext.fillStyle = '#6b7280'; // gray-500
						recordingContext.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
						recordingContext.textAlign = 'left';
						recordingContext.textBaseline = 'middle';
						
						// Clip to input field bounds
						recordingContext.save();
						recordingContext.beginPath();
						recordingContext.moveTo(inputFieldX + borderRadius, inputFieldY - inputFieldHeight / 2);
						recordingContext.lineTo(inputFieldX + inputFieldWidth - borderRadius, inputFieldY - inputFieldHeight / 2);
						recordingContext.arc(inputFieldX + inputFieldWidth - borderRadius, inputFieldY - inputFieldHeight / 2 + borderRadius, borderRadius, -Math.PI / 2, 0);
						recordingContext.lineTo(inputFieldX + inputFieldWidth, inputFieldY + inputFieldHeight / 2 - borderRadius);
						recordingContext.arc(inputFieldX + inputFieldWidth - borderRadius, inputFieldY + inputFieldHeight / 2 - borderRadius, borderRadius, 0, Math.PI / 2);
						recordingContext.lineTo(inputFieldX + borderRadius, inputFieldY + inputFieldHeight / 2);
						recordingContext.arc(inputFieldX + borderRadius, inputFieldY + inputFieldHeight / 2 - borderRadius, borderRadius, Math.PI / 2, Math.PI);
						recordingContext.lineTo(inputFieldX, inputFieldY - inputFieldHeight / 2 + borderRadius);
						recordingContext.arc(inputFieldX + borderRadius, inputFieldY - inputFieldHeight / 2 + borderRadius, borderRadius, Math.PI, -Math.PI / 2);
						recordingContext.closePath();
						recordingContext.clip();
						
						if (displayText && recordingContext) {
							const ctx = recordingContext;
							const fontStr = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
							const segments = parseBoldText(displayText);
							const fullTextWidth = segments.reduce((sum, { char, bold }) => {
								ctx.font = bold ? `bold ${fontStr}` : fontStr;
								return sum + ctx.measureText(char).width;
							}, 0);
							
							// Reserve left padding when overflowing - never let text float to left edge
							const visibleWidth = maxTextWidth - minLeftPadding;
							let scrollX = 0;
							if (fullTextWidth > maxTextWidth) {
								scrollX = fullTextWidth - visibleWidth;
							}
							
							const textY = Math.round(inputFieldY);
							let drawX = Math.round(inputFieldX + padding); // Always start at left padding
							let skippedWidth = 0;
							for (const { char, bold } of segments) {
								ctx.font = bold ? `bold ${fontStr}` : fontStr;
								const charWidth = ctx.measureText(char).width;
								if (skippedWidth + charWidth <= scrollX) {
									skippedWidth += charWidth;
									continue;
								}
								// First character that crosses scrollX - may be partial
								if (skippedWidth < scrollX) {
									drawX -= (scrollX - skippedWidth);
									skippedWidth = scrollX;
								}
								ctx.fillText(char, Math.round(drawX), textY);
								drawX += charWidth;
							}
							
							// Cursor at end of visible text
							const cursorX = Math.round(inputFieldX + padding + Math.min(fullTextWidth, visibleWidth));
							const cursorW = Math.max(1, Math.round(recordingWidth / 600));
							ctx.fillStyle = '#4b5563'; // gray-600
							ctx.fillRect(cursorX, Math.round(textY - fontSize / 2), cursorW, fontSize);
						} else {
							const cursorX = Math.round(inputFieldX + padding);
							const cursorY = Math.round(inputFieldY);
							const cursorW = Math.max(1, Math.round(recordingWidth / 600));
							recordingContext.fillStyle = '#4b5563';
							recordingContext.fillRect(cursorX, Math.round(cursorY - fontSize / 2), cursorW, fontSize);
						}
						
						recordingContext.restore(); // Restore clipping
					}
				} catch (error) {
					console.error('Error capturing frame:', error);
				}

				// If GIF export, encode this frame (skip first frame - often black)
				if (gifRecordingState && recordingContext && recordingCanvas && frameIndex > 0) {
					const { gif } = gifRecordingState;
					const imgData = recordingContext.getImageData(0, 0, recordingCanvas.width, recordingCanvas.height);
					const data = imgData.data;
					const isFirst = gifRecordingState.firstFrame;

					if (isFirst) {
						const basePalette = quantize(data, 250);
						gifRecordingState.palette = buildGifPalette(basePalette, {
							textColor,
							backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : undefined
						});
						gifRecordingState.firstFrame = false;
					}
					const index = applyPalette(data, gifRecordingState.palette);
					const gifFps = Math.min(recordingFps, 15); // Cap for reasonable GIF size
					gif.writeFrame(index, recordingCanvas.width, recordingCanvas.height, {
						palette: isFirst ? gifRecordingState.palette : undefined,
						delay: Math.round(1000 / gifFps)
					});
				}

				// Start MP4 recorder after first frame drawn (avoids black first frame)
				if (recorder && !recorderStarted) {
					recorder.startRecording();
					recorderStarted = true;
				}
				frameIndex++;

				// Schedule next frame at the correct interval
				if (isRecording) {
					setTimeout(captureFrame, frameInterval);
				}
			};

			// Start capturing frames
			captureFrame();
		} catch (error) {
			console.error('Error starting recording:', error);
			isRecording = false;
			if (browser) alert('Error starting recording. Please try again.');
		}
	}

	function stopRecording() {
		if (!isRecording || !browser) return;

		try {
			if (gifRecordingState) {
				// GIF export: finish encoding and download
				const { gif } = gifRecordingState;
				gif.finish();
				const bytes = gif.bytes();
				const blob = new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `batch-generator-${Date.now()}.gif`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
				gifRecordingState = null;
				isRecording = false;
				cleanup();
			} else if (recorder) {
				// MP4 export: download immediately (ffmpeg.wasm trim unreliable in SvelteKit)
				recorder.stopRecording(() => {
					const blob = recorder.getBlob();
					if (!blob || blob.size < 1000) {
						console.error('Recording failed: Blob is too small or invalid', blob);
						alert('Recording failed. Please try again.');
						isRecording = false;
						cleanup();
						return;
					}
					isRecording = false;
					cleanup();
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = `batch-generator-${Date.now()}.mp4`;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);
				});
			}
		} catch (error) {
			console.error('Error stopping recording:', error);
			isRecording = false;
			cleanup();
		}
	}

	function cleanup() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		if (recordingStream) {
			recordingStream.getTracks().forEach(track => track.stop());
			recordingStream = null;
		}
		if (recorder) {
			recorder.destroy();
			recorder = null;
		}
		recordingCanvas = null;
		recordingContext = null;
		
		// Clear any buffers/caches and reset animation state after recording
		// This ensures a clean slate for the next recording
		setTimeout(() => {
			displayText = '';
			currentPhase = 'greeting';
			isPlaying = false;
			// Clear any pending timeouts
			if (typewriterTimeout) {
				clearTimeout(typewriterTimeout);
				typewriterTimeout = null;
			}
		}, 100);
	}

	function toggleRecording() {
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	}

	// Initialize and auto-play
	onMount(() => {
		// Start animation automatically
		setTimeout(() => {
			startAnimation();
		}, 500); // Small delay to ensure component is fully mounted

		// Cleanup on unmount
		return () => {
			if (isRecording) {
				stopRecording();
			}
			cleanup();
		};
	});
</script>

<svelte:head>
	<title>Batch Generator - Admin</title>
</svelte:head>

<div class="w-full min-h-screen bg-gray-50">
	<div class="flex flex-col lg:flex-row gap-5 w-full max-w-7xl mx-auto px-4 py-5">
		<!-- Controls Panel -->
		<div class="flex-1 min-w-0 space-y-3">

			<!-- Message Fields -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="px-4 py-2.5 border-b border-gray-100">
					<h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</h2>
				</div>
				<div class="p-4 space-y-3">
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="hello-field" class="block text-[11px] font-medium text-gray-500 mb-1">Hello</label>
							<RichTextInput id="hello-field" bind:value={hello} placeholder="Dear" rows={1} />
						</div>
						<div>
							<label for="name-field" class="block text-[11px] font-medium text-gray-500 mb-1">Name</label>
							<RichTextInput id="name-field" bind:value={name} placeholder="Enter name" rows={1} />
						</div>
					</div>
					<div>
						<label for="content-field" class="block text-[11px] font-medium text-gray-500 mb-1">Content</label>
						<span class="block text-xs text-gray-400 mb-1">Select text, click B to bold</span>
						<RichTextInput id="content-field" bind:value={content} placeholder="Enter message content (one line per chapter)" rows={6} />
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="goodbye-field" class="block text-[11px] font-medium text-gray-500 mb-1">Goodbye</label>
							<RichTextInput id="goodbye-field" bind:value={goodbye} placeholder="Love, Santi" rows={1} />
						</div>
						<div>
							<label for="branding-field" class="block text-[11px] font-medium text-gray-500 mb-1">Branding</label>
							<RichTextInput id="branding-field" bind:value={branding} placeholder="Art-Camp, 2026" rows={1} />
						</div>
					</div>
				</div>
			</div>

			<!-- Display Settings -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="px-4 py-2.5 border-b border-gray-100">
					<h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Display</h2>
				</div>
				<div class="p-4 space-y-3">
					<label class="inline-flex items-center gap-1.5 cursor-pointer">
						<input type="checkbox" bind:checked={inputFieldVisible} class="w-3 h-3 rounded" />
						<span class="text-[11px] text-gray-500">Input</span>
					</label>

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

					<div class="border-t border-gray-100 pt-3">
						<div class="flex items-center justify-between mb-1">
							<label for="font-size" class="text-[11px] font-medium text-gray-500">
								Font Size <span class="text-gray-400">{fontSize}px</span>
							</label>
							<label class="inline-flex items-center gap-1.5 cursor-pointer">
								<input id="dynamic-text-size" type="checkbox" bind:checked={dynamicTextSize} class="w-3 h-3 rounded" />
								<span class="text-[11px] text-gray-400">Auto</span>
							</label>
						</div>
						<input id="font-size" type="range" min="20" max="80" step="2" bind:value={fontSize}
							disabled={dynamicTextSize}
							class="w-full h-1 {dynamicTextSize ? 'opacity-40 cursor-not-allowed' : ''}" />
						<p class="text-[10px] text-gray-300 mt-0.5">Auto adjusts to fill the circle evenly.</p>
					</div>

					<div>
						<label for="rotation-speed" class="block text-[11px] font-medium text-gray-500 mb-1">
							Rotation <span class="text-gray-400">{rotationSpeed.toFixed(2)}</span>
						</label>
						<input id="rotation-speed" type="range" min="-1" max="1" step="0.01" bind:value={rotationSpeed} class="w-full h-1" />
						<p class="text-[10px] text-gray-300 mt-0.5">Negative = counter-clockwise.</p>
					</div>
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
					{/if}
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
						<select id="export-format" value={exportFormat} onchange={(e) => { exportFormat = (e.target as HTMLSelectElement).value as 'mp4' | 'gif'; }} class="w-full text-xs py-2 px-3 rounded-lg border border-gray-200 bg-white focus:ring-1 focus:ring-gray-300 focus:border-gray-300">
							<option value="mp4">MP4 (video)</option>
							<option value="gif">GIF (animated)</option>
						</select>
					</div>
					<div>
						<label for="recording-width" class="block text-[11px] font-medium text-gray-500 mb-1">
							Width <span class="text-gray-400">{recordingWidth}px</span>
						</label>
						<input id="recording-width" type="range" min="400" max="2000" step="50" bind:value={recordingWidth} class="w-full h-1" />
						<p class="text-[10px] text-gray-300 mt-0.5">Height auto ({inputFieldVisible ? Math.round(recordingWidth * 1.25) : recordingWidth}px). Higher = better quality.</p>
					</div>
					<div>
						<label for="recording-fps" class="block text-[11px] font-medium text-gray-500 mb-1">
							Frame Rate <span class="text-gray-400">{recordingFps} fps</span>{#if exportFormat === 'gif'} <span class="text-gray-400">(capped 15 for GIF)</span>{/if}
						</label>
						<select id="recording-fps" value={recordingFps} onchange={(e) => { recordingFps = Number((e.target as HTMLSelectElement).value); }} class="w-full text-xs py-2 px-3 rounded-lg border border-gray-200 bg-white focus:ring-1 focus:ring-gray-300 focus:border-gray-300">
							<option value={10}>10 fps</option>
							<option value={15}>15 fps</option>
							<option value={24}>24 fps</option>
							<option value={30}>30 fps</option>
							<option value={60}>60 fps</option>
						</select>
						<p class="text-[10px] text-gray-300 mt-0.5">Higher fps = smoother video, larger file.</p>
					</div>
				</div>
			</div>

			<!-- Animation Settings -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="px-4 py-2.5 border-b border-gray-100">
					<h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Animation</h2>
				</div>
				<div class="p-4 space-y-3">
					<div class="grid grid-cols-2 gap-x-4 gap-y-3">
						<div>
							<label for="typewriter-speed" class="block text-[11px] font-medium text-gray-500 mb-1">
								Typing <span class="text-gray-400">{typewriterSpeed}ms</span>
							</label>
							<input id="typewriter-speed" type="range" min="20" max="300" step="10" bind:value={typewriterSpeed} class="w-full h-1" />
							<p class="text-[10px] text-gray-300 mt-0.5">Per letter. Lower = faster.</p>
						</div>

						<div>
							<div class="flex items-center justify-between mb-1">
								<label for="delete-speed" class="text-[11px] font-medium text-gray-500">
									Delete <span class="text-gray-400">{deleteSpeed}ms</span>
								</label>
								<label class="inline-flex items-center gap-1 cursor-pointer">
									<input id="instant-clear" type="checkbox" bind:checked={instantClear} class="w-3 h-3 rounded" />
									<span class="text-[10px] text-gray-400">Instant</span>
								</label>
							</div>
							<input id="delete-speed" type="range" min="10" max="200" step="10" bind:value={deleteSpeed}
								disabled={instantClear}
								class="w-full h-1 {instantClear ? 'opacity-40 cursor-not-allowed' : ''}" />
							<p class="text-[10px] text-gray-300 mt-0.5">Per letter removal speed.</p>
						</div>

						<div>
							<label for="chapter-pause" class="block text-[11px] font-medium text-gray-500 mb-1">
								Line Pause <span class="text-gray-400">{chapterPause}ms</span>
							</label>
							<input id="chapter-pause" type="range" min="0" max="2000" step="50" bind:value={chapterPause} class="w-full h-1" />
							<p class="text-[10px] text-gray-300 mt-0.5">Blank gap between lines.</p>
						</div>

						<div>
							<label for="speed-variation" class="block text-[11px] font-medium text-gray-500 mb-1">
								Variation <span class="text-gray-400">{speedVariation}%</span>
							</label>
							<input id="speed-variation" type="range" min="0" max="100" step="5" bind:value={speedVariation} class="w-full h-1" />
							<p class="text-[10px] text-gray-300 mt-0.5">Randomness for natural feel.</p>
						</div>

						<div>
							<label for="visible-duration" class="block text-[11px] font-medium text-gray-500 mb-1">
								Hold <span class="text-gray-400">{visibleDuration}ms</span>
							</label>
							<input id="visible-duration" type="range" min="0" max="2000" step="50" bind:value={visibleDuration} class="w-full h-1" />
							<p class="text-[10px] text-gray-300 mt-0.5">Time on screen before delete. Scales with words.</p>
						</div>

						<div>
							<label for="goodbye-pause" class="block text-[11px] font-medium text-gray-500 mb-1">
								Goodbye Gap <span class="text-gray-400">{goodbyePause}ms</span>
							</label>
							<input id="goodbye-pause" type="range" min="0" max="1000" step="50" bind:value={goodbyePause} class="w-full h-1" />
							<p class="text-[10px] text-gray-300 mt-0.5">Pause before branding types.</p>
						</div>
					</div>

					<div class="border-t border-gray-100 pt-3">
						<label for="delay-before-after" class="block text-[11px] font-medium text-gray-500 mb-1">
							Start/End Delay <span class="text-gray-400">{delayBeforeAfter}ms</span>
						</label>
						<input id="delay-before-after" type="range" min="0" max="2000" step="100" bind:value={delayBeforeAfter} class="w-full h-1" />
						<p class="text-[10px] text-gray-300 mt-0.5">Blank time before first line and after last line.</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Canvas & Controls -->
		<div class="flex-shrink-0 lg:sticky lg:top-5 lg:self-start">
			<div 
				bind:this={containerRef}
				class="relative rounded-2xl overflow-hidden mx-auto flex flex-col shadow-sm"
				style="width: {containerWidth}px; height: {containerHeight}px; background-color: {backgroundColor};"
			>
				{#if backgroundMedia && currentBackgroundFile}
					<div class="absolute inset-0 z-0" style="opacity: {backgroundOpacity};">
						{#if backgroundMediaType === 'image'}
							<img src={currentBackgroundFile.url} alt="Background" class="w-full h-full object-cover"
								style="object-position: {backgroundPositionX}% {backgroundPositionY}%;" />
						{:else if backgroundMediaType === 'video'}
							<video src={currentBackgroundFile.url} class="w-full h-full object-cover"
								style="object-position: {backgroundPositionX}% {backgroundPositionY}%;"
								autoplay loop muted playsinline>
								<track kind="captions" />
							</video>
						{/if}
					</div>
				{/if}
				<!-- Circle area -->
				<div class="flex-1 flex items-center justify-center relative z-10">
					<TextCircle
						bind:this={textCircleRef}
						text={displayText}
						fontSize={fontSize}
						radius={((inputFieldVisible ? containerWidth : containerSize) / 2 - fontSize * 2.5) * 0.93}
						rotationSpeed={rotationSpeed}
						spacingAmplitudePercent={0}
						spacingSpeed={0}
						rotationStart={0}
						animationType="sin"
						containerSize={inputFieldVisible ? containerWidth : containerSize}
						paused={paused}
						textColor={textColor}
						autoTextSize={dynamicTextSize}
						fadeInTime={0}
						fadeOutTime={0}
						pauseTime={0}
						visibleTime={999}
						manualMode={true}
						triggerFadeIn={false}
						triggerFadeOut={false}
					/>
				</div>
				
				<!-- Input field (visual only) - above background -->
				{#if inputFieldVisible}
					<div class="relative z-10 px-4 pb-6">
						<div class="w-8/12 mx-auto rounded-full h-14 bg-gray-100 px-6 py-3 flex items-center">
							<div 
								bind:this={inputFieldRef}
								class="flex-1 text-gray-500 text-2xl overflow-x-auto overflow-y-hidden whitespace-nowrap flex items-center min-w-0 pl-3"
								style="scrollbar-width: none; -ms-overflow-style: none;"
							>
								{#if displayText}
									<span class="inline-block">{@html boldTextToHtml(displayText)}</span>
								{/if}
								<span class="inline-block w-[1px] h-6 bg-gray-600 ml-1 cursor-blink flex-shrink-0"></span>
							</div>
						</div>
					</div>
					<style>
						div[class*="rounded-full"]::-webkit-scrollbar {
							display: none;
						}
						@keyframes blink {
							0%, 50% { opacity: 1; }
							51%, 100% { opacity: 0; }
						}
						.cursor-blink {
							animation: blink 1s infinite;
						}
						/* M3-style inputs */
						:global(.m3-input) {
							border: 1px solid #79747e;
							color: #1d1b20;
						}
						:global(.m3-input:focus) {
							border-color: #6750a4;
							border-width: 2px;
							padding: 3px 7px;
						}
						:global(.m3-input::placeholder) {
							color: #79747e;
						}
						/* M3-style buttons */
						:global(.m3-btn) {
							background: #e8def8;
							color: #1d1b20;
						}
						:global(.m3-btn:hover) {
							background: #d0bcff;
						}
					</style>
				{/if}
			</div>
			
			<!-- Toolbar -->
			<div class="mt-3 flex items-center justify-center gap-2">
				<button
					class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
						{isRecording ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}"
					onclick={toggleRecording}
				>
					{#if !isRecording}
						<span class="w-2 h-2 bg-red-500 rounded-full"></span> Record
					{:else}
						<span class="w-2 h-2 bg-white rounded-sm"></span> Stop
					{/if}
				</button>

				<button
					class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors disabled:opacity-40"
					onclick={restartAnimation}
					disabled={isRecording}
				>
					Restart
				</button>

				<button
					class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors disabled:opacity-40"
					onclick={togglePause}
					disabled={isRecording}
				>
					{paused ? 'Resume' : 'Pause'}
				</button>

			</div>

			{#if isRecording}
				<div class="mt-2 flex justify-center">
					<RecordingIndicator {isRecording} {elapsedTime} size="md" />
				</div>
			{/if}

			<p class="mt-2 text-[10px] text-gray-300 text-center max-w-sm mx-auto leading-relaxed">
				Recording runs in-browser. Close other tabs for best performance.
			</p>
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
