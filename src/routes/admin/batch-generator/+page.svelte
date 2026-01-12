<script lang="ts">
	import TextCircle from '$lib/components/TextCircle.svelte';
	import { Input, Button, RecordingIndicator } from '$lib/primitives';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Form fields
	let hello = $state('Dear');
	let name = $state('Peter');
	let content = $state(`Learn to watch snails and plant impossible gardens. 
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
	let chapterPause = $state(1200); // milliseconds to pause between chapters
	let speedVariation = $state(25); // percentage variation in typing speed (0-100)
	let visibleDuration = $state(600); // milliseconds to keep chapter visible before deleting
	let goodbyePause = $state(500); // milliseconds to pause between goodbye and branding
	let delayBeforeAfter = $state(300); // milliseconds to pause before animation starts and after it finishes

	// TextCircle props
	let textColor = $state('#000000');
	let backgroundColor = $state('#ffffff');
	let containerSize = $state(600);
	let fontSize = $state(40);
	let rotationSpeed = $state(0.2);
	let paused = $state(false);
	let dynamicTextSize = $state(true); // Auto-adjust font size to fill circumference
	let inputFieldVisible = $state(true); // Show input field and use portrait format
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
				// Deletion complete, move to next phase
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
											isPlaying = false;
											currentPhase = 'greeting';
											displayText = '';
											
											// Wait for delay after animation, then stop recording
											setTimeout(() => {
												// Automatically stop recording when animation completes
												if (isRecording) {
													stopRecording();
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

	// Recording functions
	async function startRecording() {
		if (isRecording || !textCircleRef || !browser) return;

		// Ensure animation is not paused
		paused = false;

		// Restart the animation when starting to record
		stopAnimation();
		setTimeout(() => {
			startAnimation();
		}, 100);

		try {
			// Dynamically import RecordRTC
			const RecordRTCModule = await import('recordrtc');
			const RecordRTC = RecordRTCModule.default;

			// Determine recording dimensions based on inputFieldVisible
			let recordingWidth: number;
			let recordingHeight: number;
			let circleAreaHeight: number;
			let inputFieldAreaHeight: number;
			
			if (inputFieldVisible) {
				// 4:5 portrait format (600x750)
				recordingWidth = 600;
				recordingHeight = 750; // 4:5 aspect ratio (600 * 1.25 = 750)
				circleAreaHeight = 600; // Circle takes up the width
				inputFieldAreaHeight = 150; // Input field area at bottom (750 - 600 = 150)
			} else {
				// Square format
				recordingWidth = 600;
				recordingHeight = 600;
				circleAreaHeight = 600;
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

			// Start recording
			recorder.startRecording();
			isRecording = true;
			elapsedTime = 0;

			// Start timer
			timerInterval = setInterval(() => {
				elapsedTime++;
			}, 1000);

			// Capture frames at the correct FPS using setTimeout for consistent timing
			const frameInterval = 1000 / FPS; // milliseconds per frame

			const captureFrame = () => {
				if (!isRecording || !recordingContext || !recordingCanvas || !textCircleRef) {
					return;
				}

				try {
					// Ensure animation is not paused
					paused = false;

					// Draw background first (to avoid white flash)
					if (backgroundColor !== 'transparent') {
						recordingContext.fillStyle = backgroundColor;
						recordingContext.fillRect(0, 0, recordingWidth, recordingHeight);
					} else {
						// Clear only if transparent background
						recordingContext.clearRect(0, 0, recordingCanvas.width, recordingCanvas.height);
					}

					// Prefer the live TextCircle canvas to avoid re-render flicker; fallback to captureCanvas
					const circleCanvas = (textCircleRef.getCanvas && textCircleRef.getCanvas()) || textCircleRef.captureCanvas(false);
					if (circleCanvas && circleCanvas.width > 0 && circleCanvas.height > 0) {
						// The container size is always 600px for recording
						const actualContainerSize = 600;
						const scaleFactor = recordingWidth / actualContainerSize; // Should be 1.0
						
						// Draw the circle canvas centered in the circle area
						const circleX = (recordingWidth - actualContainerSize * scaleFactor) / 2;
						const circleY = (circleAreaHeight - actualContainerSize * scaleFactor) / 2;
						
						recordingContext.save();
						recordingContext.translate(circleX + (actualContainerSize * scaleFactor) / 2, circleY + (actualContainerSize * scaleFactor) / 2);
						recordingContext.scale(scaleFactor, scaleFactor);
						recordingContext.drawImage(circleCanvas, -actualContainerSize / 2, -actualContainerSize / 2, actualContainerSize, actualContainerSize);
						recordingContext.restore();
					}

					// Draw input field if visible
					if (inputFieldVisible && displayText !== undefined) {
						const inputFieldY = circleAreaHeight + (inputFieldAreaHeight / 2);
						const inputFieldWidth = recordingWidth * 0.67; // 8/12 of width
						const inputFieldX = (recordingWidth - inputFieldWidth) / 2;
						const inputFieldHeight = 56; // h-14 = 56px (no scaling needed since recording is 600px)
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
						const padding = 24; // px-6 = 24px
						const fontSize = 24; // text-2xl = 24px
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
							
							// Draw text at scrolled position
							const textX = inputFieldX + padding - scrollX;
							const textY = inputFieldY;
							recordingContext.fillText(displayText, textX, textY);
							
							// Draw blinking cursor at the end of text
							const cursorX = textX + fullTextWidth;
							const cursorOpacity = Math.floor(Date.now() / 500) % 2 === 0 ? 1 : 0;
							recordingContext.fillStyle = `rgba(75, 85, 99, ${cursorOpacity})`; // gray-600 with opacity
							recordingContext.fillRect(cursorX, inputFieldY - fontSize / 2, 1, fontSize);
						} else {
							// Draw blinking cursor even when text is empty
							const cursorX = inputFieldX + padding;
							const cursorOpacity = Math.floor(Date.now() / 500) % 2 === 0 ? 1 : 0;
							recordingContext.fillStyle = `rgba(75, 85, 99, ${cursorOpacity})`; // gray-600 with opacity
							recordingContext.fillRect(cursorX, inputFieldY - fontSize / 2, 1, fontSize);
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
		// Restore paused state if needed
		// paused = false; // Keep animation running after recording
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

<div class="w-full">
	<h1 class="text-3xl font-bold text-gray-900 mb-8 px-4">Batch Generator</h1>
	
	<div class="flex flex-col lg:flex-row gap-6 h-full w-full max-w-7xl mx-auto p-4">
		<!-- Form Fields - Scrollable -->
		<div class="flex-1 min-w-0 space-y-6">
			<div class="bg-white p-6 rounded-lg">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Message Fields</h2>
				
				<div class="space-y-4">
					<Input
						type="text"
						label="Hello"
						bind:value={hello}
						placeholder="Dear"
					/>
					
					<Input
						type="text"
						label="Name"
						bind:value={name}
						placeholder="Enter name"
					/>
					
					<div class="flex flex-col gap-1 w-full">
						<label for="content-field" class="font-medium text-neutral-700 text-sm">
							Content
						</label>
						<textarea
							id="content-field"
							bind:value={content}
							placeholder="Enter message content"
							rows="10"
							class="p-2 border border-gray-300 rounded text-base font-inherit transition-all duration-200 bg-white
								focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
								resize-y min-h-[100px]"
						></textarea>
					</div>
					
					<Input
						type="text"
						label="Goodbye"
						bind:value={goodbye}
						placeholder="Love, Santi"
					/>
					
					<Input
						type="text"
						label="Branding"
						bind:value={branding}
						placeholder="Artcamp, 2026"
					/>
				</div>
			</div>

			<!-- Animation Settings -->
			<div class="bg-white p-6 rounded-lg shadow">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Animation Settings</h2>
				
				<div class="space-y-4">
					<div>
						<label for="typewriter-speed" class="block text-sm font-medium text-gray-700 mb-2">
							Typing Speed: {typewriterSpeed}ms per character
						</label>
						<input
							id="typewriter-speed"
							type="range"
							min="20"
							max="300"
							step="10"
							bind:value={typewriterSpeed}
							class="w-full"
						/>
					</div>
					
					<div>
						<label for="delete-speed" class="block text-sm font-medium text-gray-700 mb-2">
							Delete Speed: {deleteSpeed}ms per character
						</label>
						<input
							id="delete-speed"
							type="range"
							min="10"
							max="200"
							step="10"
							bind:value={deleteSpeed}
							class="w-full"
						/>
					</div>
					
					<div>
						<label for="chapter-pause" class="block text-sm font-medium text-gray-700 mb-2">
							Chapter Pause: {chapterPause}ms
						</label>
						<input
							id="chapter-pause"
							type="range"
							min="0"
							max="2000"
							step="50"
							bind:value={chapterPause}
							class="w-full"
						/>
					</div>
					
					<div>
						<label for="speed-variation" class="block text-sm font-medium text-gray-700 mb-2">
							Speed Variation: {speedVariation}%
						</label>
						<input
							id="speed-variation"
							type="range"
							min="0"
							max="100"
							step="5"
							bind:value={speedVariation}
							class="w-full"
						/>
					</div>
					
					<div>
						<label for="visible-duration" class="block text-sm font-medium text-gray-700 mb-2">
							Visible Duration: {visibleDuration}ms
						</label>
						<input
							id="visible-duration"
							type="range"
							min="0"
							max="2000"
							step="50"
							bind:value={visibleDuration}
							class="w-full"
						/>
						<p class="text-xs text-gray-500 mt-1">How long text stays visible before deletion</p>
					</div>
					
					<div>
						<label for="goodbye-pause" class="block text-sm font-medium text-gray-700 mb-2">
							Goodbye Pause: {goodbyePause}ms
						</label>
						<input
							id="goodbye-pause"
							type="range"
							min="0"
							max="1000"
							step="50"
							bind:value={goodbyePause}
							class="w-full"
						/>
						<p class="text-xs text-gray-500 mt-1">Pause between goodbye and branding</p>
					</div>
					
					<div>
						<label for="delay-before-after" class="block text-sm font-medium text-gray-700 mb-2">
							Delay Before & After: {delayBeforeAfter}ms
						</label>
						<input
							id="delay-before-after"
							type="range"
							min="0"
							max="2000"
							step="100"
							bind:value={delayBeforeAfter}
							class="w-full"
						/>
						<p class="text-xs text-gray-500 mt-1">Pause before animation starts and after it finishes</p>
					</div>
				</div>
			</div>

			<!-- Display Settings -->
			<div class="bg-white p-6 rounded-lg shadow">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Display Settings</h2>
				
				<div class="space-y-4">
					<div>
						<label for="text-color" class="block text-sm font-medium text-gray-700 mb-2">
							Text Color
						</label>
						<input
							id="text-color"
							type="color"
							bind:value={textColor}
							class="w-full h-10"
						/>
					</div>
					
					<div>
						<label for="bg-color" class="block text-sm font-medium text-gray-700 mb-2">
							Background Color
						</label>
						<input
							id="bg-color"
							type="color"
							bind:value={backgroundColor}
							class="w-full h-10"
						/>
					</div>
					
					<div>
						<label for="font-size" class="block text-sm font-medium text-gray-700 mb-2">
							Font Size: {fontSize}px
						</label>
						<input
							id="font-size"
							type="range"
							min="20"
							max="80"
							step="2"
							bind:value={fontSize}
							disabled={dynamicTextSize}
							class="w-full {dynamicTextSize ? 'opacity-50 cursor-not-allowed' : ''}"
						/>
						{#if dynamicTextSize}
							<p class="text-xs text-gray-500 mt-1">Font size is automatically adjusted</p>
						{/if}
					</div>
					
					<div class="flex items-center gap-2">
						<input
							id="dynamic-text-size"
							type="checkbox"
							bind:checked={dynamicTextSize}
							class="w-4 h-4"
						/>
						<label for="dynamic-text-size" class="text-sm font-medium text-gray-700">
							Dynamic Text Size
						</label>
					</div>
					
					<div>
						<label for="rotation-speed" class="block text-sm font-medium text-gray-700 mb-2">
							Rotation Speed: {rotationSpeed.toFixed(2)}
						</label>
						<input
							id="rotation-speed"
							type="range"
							min="-1"
							max="1"
							step="0.01"
							bind:value={rotationSpeed}
							class="w-full"
						/>
					</div>
				</div>
			</div>

		</div>

		<!-- Text Circle Display - Sticky on larger screens -->
		<div class="flex-shrink-0 lg:sticky lg:top-4 lg:self-start">
			<div 
				bind:this={containerRef}
				class="relative rounded-3xl overflow-hidden mx-auto flex flex-col"
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
						<div 
							bind:this={inputFieldRef}
							class="w-8/12 mx-auto rounded-full h-14 bg-gray-100 px-6 py-3 text-gray-500 text-2xl overflow-x-auto overflow-y-hidden whitespace-nowrap flex items-center"
							style="scrollbar-width: none; -ms-overflow-style: none;"
						>
							{#if displayText}
								<span class="inline-block">{displayText}</span>
							{/if}
							<span class="inline-block w-[1px] h-6 bg-gray-600 ml-1 cursor-blink"></span>
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
					</style>
				{/if}
			</div>
			
			<!-- Record Video Button and Input Field Visible Toggle -->
			<div class="mt-4 flex flex-col items-center gap-2">
				<div class="flex items-center gap-4">
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
					
					<div class="flex items-center gap-2">
						<input
							id="input-field-visible"
							type="checkbox"
							bind:checked={inputFieldVisible}
							class="w-4 h-4"
						/>
						<label for="input-field-visible" class="text-sm font-medium text-gray-700">
							Input Field Visible
						</label>
					</div>
				</div>
				{#if isRecording}
					<RecordingIndicator {isRecording} {elapsedTime} size="md" />
				{/if}
			</div>
		</div>
	</div>
	
	<!-- Recording Warning Banner -->
	{#if isRecording}
		<div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full px-4">
			<div class="bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-lg p-4">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 text-2xl">⚠️</div>
					<div class="flex-1">
						<h3 class="text-sm font-bold text-yellow-900 mb-2">Recording in Progress</h3>
						<p class="text-xs text-yellow-800 mb-2">
							<strong>Please do not:</strong> Touch your computer, scroll, switch tabs, or move the window.
						</p>
						<p class="text-xs text-yellow-700">
							Recording will automatically stop when the animation finishes.
						</p>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
