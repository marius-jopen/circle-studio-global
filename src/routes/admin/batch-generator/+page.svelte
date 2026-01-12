<script lang="ts">
	import TextCircle from '$lib/components/TextCircle.svelte';
	import { Input } from '$lib/primitives';
	import { onMount } from 'svelte';

	// Form fields
	let hello = $state('Dear');
	let name = $state('Peter');
	let content = $state(`Learn to watch snails and plant impossible gardens. 
Invite someone dangerous to tea. 
Make little signs that say yes! 
And post them all over your house.`);
	let goodbye = $state('Love, Santi');

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
	let visibleDuration = $state(700); // milliseconds to keep chapter visible before deleting

	// TextCircle props
	let textColor = $state('#000000');
	let backgroundColor = $state('#ffffff');
	let containerSize = $state(600);
	let fontSize = $state(40);
	let rotationSpeed = $state(0.2);
	let paused = $state(false);
	let dynamicTextSize = $state(true); // Auto-adjust font size to fill circumference

	// Get full text for current phase
	function getFullTextForPhase(phase: 'greeting' | 'content' | 'goodbye'): string {
		if (phase === 'greeting') {
			return name.trim() ? `${hello} ${name},` : hello;
		} else if (phase === 'content') {
			return content || '';
		} else if (phase === 'goodbye') {
			return goodbye;
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
	function getVisibleDurationForText(text: string): number {
		const wordCount = getWordCount(text);
		// Base duration per word, so longer texts stay visible longer
		return visibleDuration * wordCount;
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
	function typeText(fullText: string, onComplete: () => void) {
		let currentIndex = 0;
		displayText = '';

		function typeNextCharacter() {
			if (!isPlaying) {
				return;
			}

			if (currentIndex < fullText.length) {
				displayText = fullText.slice(0, currentIndex + 1);
				currentIndex++;
				const variedSpeed = getVariedSpeed(typewriterSpeed, speedVariation);
				typewriterTimeout = setTimeout(typeNextCharacter, variedSpeed);
			} else {
				// Typing complete, wait for visible duration (based on word count) then delete and move to next phase
				const durationForThisText = getVisibleDurationForText(fullText);
				setTimeout(() => {
					if (isPlaying) {
						onComplete();
					}
				}, durationForThisText);
			}
		}

		typeNextCharacter();
	}

	// Start the animation sequence
	function startAnimation() {
		if (isPlaying) return;
		
		isPlaying = true;
		currentPhase = 'greeting';
		
		// Start typing greeting
		typeText(getFullTextForPhase('greeting'), () => {
			// Greeting complete, delete it then move to content lines
			deleteText(displayText, () => {
				// Process each content line as a separate chapter
				processContentLines(0);
			});
		});
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
					typeText(getFullTextForPhase('goodbye'), () => {
						// All done
						isPlaying = false;
						currentPhase = 'greeting';
						displayText = '';
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
			});
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

	// Initialize and auto-play
	onMount(() => {
		// Start animation automatically
		setTimeout(() => {
			startAnimation();
		}, 500); // Small delay to ensure component is fully mounted
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
				class="relative rounded-3xl overflow-hidden mx-auto"
				style="width: {containerSize}px; height: {containerSize}px; background-color: {backgroundColor};"
			>
				<TextCircle
					text={displayText}
					fontSize={fontSize}
					radius={containerSize / 2 - fontSize * 2.5}
					rotationSpeed={rotationSpeed}
					spacingAmplitudePercent={0}
					spacingSpeed={0}
					rotationStart={0}
					animationType="sin"
					containerSize={containerSize}
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

		</div>
	</div>
</div>
