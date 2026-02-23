<script lang="ts">
	import TextCircle from '$lib/components/TextCircle.svelte';
	import { Input, Button, RecordingIndicator } from '$lib/primitives';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Form fields
	let hello = $state('Dear');
	let name = $state('Peter');
	let content = $state(`Learn to observe snails and plant impossible gardens. 
Invite someone dangerous to tea.`);
	let goodbye = $state('Love, Santi');
	let branding = $state('Artcamp, 2026');

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
	let recordingWidth = $state(1080); // Recording width in pixels (default 600)
	let inputFieldRef = $state<HTMLDivElement | null>(null);
	let containerRef = $state<HTMLDivElement | null>(null); // Reference to the container to record
	let textCircleRef = $state<any>(null); // Reference to TextCircle component

	// Recording state
	let isRecording = $state(false);
	let recorder: any = null;
	let recordingStream: MediaStream | null = null;
	let elapsedTime = $state(0);
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let recordingCanvas: HTMLCanvasElement | null = null;
	let recordingContext: CanvasRenderingContext2D | null = null;
	const FPS = 30;

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
			// Dynamically import RecordRTC
			const RecordRTCModule = await import('recordrtc');
			const RecordRTC = RecordRTCModule.default;

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

			// Create stream from canvas
			recordingStream = recordingCanvas.captureStream(FPS);

			if (!recordingStream || recordingStream.getVideoTracks().length === 0) {
				console.error('Failed to create media stream from canvas');
				return;
			}

			// Calculate bitrate
			let bitrate = 8000000; // 8Mbps base
			if (recordingWidth >= 1440) bitrate = 16000000; // 16Mbps for larger
			if (recordingWidth >= 2160) bitrate = 30000000; // 30Mbps for 4K

			// Initialize RecordRTC
			// @ts-ignore
			recorder = new RecordRTC(recordingStream, {
				type: 'video',
				mimeType: 'video/mp4',
				frameRate: FPS,
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

			// Draw blank frame first to ensure clean start
			recordingContext.clearRect(0, 0, recordingCanvas.width, recordingCanvas.height);
			if (backgroundColor !== 'transparent') {
				recordingContext.fillStyle = backgroundColor;
				recordingContext.fillRect(0, 0, recordingWidth, recordingHeight);
			}
			// Draw empty input field if visible
			if (inputFieldVisible) {
				const inputFieldY = circleAreaHeight + (inputFieldAreaHeight / 2) + (15 * (recordingWidth / 600));
				const inputFieldWidth = recordingWidth * 0.67;
				const inputFieldX = (recordingWidth - inputFieldWidth) / 2;
				const inputFieldHeight = 56 * (recordingWidth / 600);
				const borderRadius = inputFieldHeight / 2;
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

			// Start recording AFTER blank frame is drawn
			recorder.startRecording();
			isRecording = true;
			elapsedTime = 0;

			// Start timer
			timerInterval = setInterval(() => {
				elapsedTime++;
			}, 1000);

			// Wait a moment before starting animation to ensure first frames are blank
			setTimeout(() => {
				startAnimation();
			}, 200);

			// Capture frames at the correct FPS using setTimeout for consistent timing
			const frameInterval = 1000 / FPS; // milliseconds per frame

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

					// Draw input field if visible
					if (inputFieldVisible && displayText !== undefined) {
						// Move input field down by 15px in video (scaled proportionally)
						const inputFieldYOffset = 15 * (recordingWidth / 600); // Scale from base 600px
						const inputFieldY = circleAreaHeight + (inputFieldAreaHeight / 2) + inputFieldYOffset;
						const inputFieldWidth = recordingWidth * 0.67; // 8/12 of width
						const inputFieldX = (recordingWidth - inputFieldWidth) / 2;
						// Scale input field height proportionally to recording width
						const inputFieldHeight = 56 * (recordingWidth / 600); // Scale from base 600px
						const borderRadius = inputFieldHeight / 2;
						
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

						// Draw text in input field (with proper scrolling behavior like browser)
						// Scale padding and font size proportionally to recording width
						const padding = 24 * (recordingWidth / 600); // Scale from base 600px
						const fontSize = 24 * (recordingWidth / 600); // Scale from base 600px
						const maxTextWidth = inputFieldWidth - (padding * 2);
						
						recordingContext.fillStyle = '#9ca3af'; // gray-400
						recordingContext.font = `${fontSize}px Arial, sans-serif`;
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
						
						if (displayText) {
							// Calculate full text width
							const fullTextWidth = recordingContext.measureText(displayText).width;
							
							// Calculate scroll position (like browser - scroll to show cursor at right edge when text is long)
							let scrollX = 0;
							if (fullTextWidth > maxTextWidth) {
								// Scroll so cursor is visible at the right edge
								scrollX = fullTextWidth - maxTextWidth;
							}
							
							// Draw text at scrolled position (moved down by 2px in video, scaled proportionally)
							const textX = inputFieldX + padding - scrollX;
							const textYOffset = 2 * (recordingWidth / 600); // Scale from base 600px
							const textY = inputFieldY + textYOffset;
							recordingContext.fillText(displayText, textX, textY);
							
							// Draw blinking cursor at the end of text (moved down by 2px to match text)
							const cursorX = textX + fullTextWidth;
							const cursorOpacity = Math.floor(Date.now() / 500) % 2 === 0 ? 1 : 0;
							recordingContext.fillStyle = `rgba(75, 85, 99, ${cursorOpacity})`; // gray-600 with opacity
							recordingContext.fillRect(cursorX, textY - fontSize / 2, 1 * (recordingWidth / 600), fontSize);
						} else {
							// Draw blinking cursor even when text is empty (moved down by 2px, scaled proportionally)
							const cursorX = inputFieldX + padding;
							const textYOffset = 2 * (recordingWidth / 600); // Scale from base 600px
							const cursorY = inputFieldY + textYOffset;
							const cursorOpacity = Math.floor(Date.now() / 500) % 2 === 0 ? 1 : 0;
							recordingContext.fillStyle = `rgba(75, 85, 99, ${cursorOpacity})`; // gray-600 with opacity
							recordingContext.fillRect(cursorX, cursorY - fontSize / 2, 1, fontSize);
						}
						
						recordingContext.restore(); // Restore clipping
					}
				} catch (error) {
					console.error('Error capturing frame:', error);
				}

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
		if (!isRecording || !recorder || !browser) return;

		try {
			recorder.stopRecording(() => {
				try {
					const blob = recorder.getBlob();
					if (!blob || blob.size < 1000) {
						console.error('Recording failed: Blob is too small or invalid', blob);
						alert('Recording failed. Please try again.');
						isRecording = false;
						cleanup();
						return;
					}

					// Create download link
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = `batch-generator-${Date.now()}.mp4`;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);

					isRecording = false;
					cleanup();
				} catch (error) {
					console.error('Error processing recording:', error);
					if (browser) alert('Error processing recording. Please try again.');
					isRecording = false;
					cleanup();
				}
			});
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
							<input id="hello-field" type="text" bind:value={hello} placeholder="Dear"
								class="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors" />
						</div>
						<div>
							<label for="name-field" class="block text-[11px] font-medium text-gray-500 mb-1">Name</label>
							<input id="name-field" type="text" bind:value={name} placeholder="Enter name"
								class="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors" />
						</div>
					</div>
					<div>
						<label for="content-field" class="block text-[11px] font-medium text-gray-500 mb-1">Content</label>
						<textarea
							id="content-field"
							bind:value={content}
							placeholder="Enter message content (one line per chapter)"
							rows="6"
							class="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors resize-y min-h-[80px]"
						></textarea>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="goodbye-field" class="block text-[11px] font-medium text-gray-500 mb-1">Goodbye</label>
							<input id="goodbye-field" type="text" bind:value={goodbye} placeholder="Love, Santi"
								class="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors" />
						</div>
						<div>
							<label for="branding-field" class="block text-[11px] font-medium text-gray-500 mb-1">Branding</label>
							<input id="branding-field" type="text" bind:value={branding} placeholder="Artcamp, 2026"
								class="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors" />
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

					<div>
						<label for="recording-width" class="block text-[11px] font-medium text-gray-500 mb-1">
							Recording <span class="text-gray-400">{recordingWidth}x{inputFieldVisible ? Math.round(recordingWidth * 1.25) : recordingWidth}px</span>
						</label>
						<input id="recording-width" type="range" min="400" max="2000" step="50" bind:value={recordingWidth} class="w-full h-1" />
						<p class="text-[10px] text-gray-300 mt-0.5">Higher = better quality, larger file.</p>
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
				<!-- Circle area -->
				<div class="flex-1 flex items-center justify-center relative">
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
				
				<!-- Input field (visual only) -->
				{#if inputFieldVisible}
					<div class="px-4 pb-6">
						<div class="w-8/12 mx-auto rounded-full h-14 bg-gray-100 px-6 py-3 flex items-center">
							<div 
								bind:this={inputFieldRef}
								class="flex-1 text-gray-500 text-2xl overflow-x-auto overflow-y-hidden whitespace-nowrap flex items-center"
								style="scrollbar-width: none; -ms-overflow-style: none;"
							>
								{#if displayText}
									<span class="inline-block">{displayText}</span>
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

				<label class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-500 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
					<input type="checkbox" bind:checked={inputFieldVisible} class="w-3 h-3 rounded" />
					Input
				</label>
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
