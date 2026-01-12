<script lang="ts">
	import TextCircle from '$lib/components/TextCircle.svelte';
	import { Input } from '$lib/primitives';
	import { onMount } from 'svelte';

	// Form fields
	let hello = $state('Dear');
	let name = $state('Peter');
	let content = $state(`Learn to watch snails and plant impossible gardens. 
Invite someone dangerous to tea. 
Make little signs that say yes! And post them all over your house.`);
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
	let goodbyePause = $state(100); // milliseconds to pause between goodbye and branding

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
		}, 'greeting');
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
					// Type goodbye first
					typeText(goodbye, () => {
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
						});
					}, 'goodbye', currentGoodbyeText);
							}
						}, variedPause);
					}, 'goodbye');
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
			</div>

		</div>

		<!-- Text Circle Display - Sticky on larger screens -->
		<div class="flex-shrink-0 lg:sticky lg:top-4 lg:self-start">
			<div 
				class="relative rounded-3xl overflow-hidden mx-auto flex flex-col"
				style="width: {containerWidth}px; height: {containerHeight}px; background-color: {backgroundColor};"
			>
				<!-- Circle area -->
				<div class="flex-1 flex items-center justify-center relative">
					<TextCircle
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
							class="w-8/12 mx-auto rounded-full h-14 bg-gray-100 px-6 py-3 text-gray-400 text-2xl overflow-x-auto overflow-y-hidden whitespace-nowrap flex items-center"
							style="scrollbar-width: none; -ms-overflow-style: none;"
						>
							{#if displayText}
								<span class="inline-block">{displayText}</span>
							{/if}
						</div>
					</div>
					<style>
						div[class*="rounded-full"]::-webkit-scrollbar {
							display: none;
						}
					</style>
				{/if}
			</div>

		</div>
	</div>
</div>
