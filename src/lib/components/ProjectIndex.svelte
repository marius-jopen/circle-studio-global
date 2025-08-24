<script lang="ts">
	import { onMount } from 'svelte';
	import type { ProjectsDocument } from '../../prismicio-types';
	import ProjectItem from './projectItem.svelte';

	export let allProjects: ProjectsDocument[] = [];
	export let featuredProjectIds: string[] = [];

	// State to control visibility and prevent flash
	let isReady = false;
	let persistentProjectOrder: ProjectsDocument[] = [];

	// Get or create persistent project order
	function getPersistentProjectOrder(projects: ProjectsDocument[]): ProjectsDocument[] {
		console.log('🔄 getPersistentProjectOrder called with', projects.length, 'projects');
		
		// Check if we're in browser environment
		if (typeof window === 'undefined') {
			console.log('🌐 Server-side rendering, creating temporary order');
			return shuffleArray([...projects]);
		}
		
		// Try to get stored order first
		const storedOrder = localStorage.getItem('projectIndexOrder');
		console.log('💾 Stored order from localStorage:', storedOrder);
		
		if (storedOrder) {
			try {
				const storedIds = JSON.parse(storedOrder);
				console.log('📋 Parsed stored IDs:', storedIds);
				
				// Check if the stored order matches current projects
				if (storedIds.length === projects.length) {
					// Try to reconstruct the order from stored IDs
					const orderedProjects = storedIds.map((id: string) => 
						projects.find(p => p.id === id)
					).filter(Boolean);
					
					if (orderedProjects.length === projects.length) {
						console.log('✅ Stored order matches current projects, using it');
						return orderedProjects as ProjectsDocument[];
					} else {
						console.log('❌ Stored order reconstruction failed, creating new one');
					}
				} else {
					console.log('❌ Stored order length mismatch, creating new one');
				}
			} catch (e) {
				console.log('❌ Failed to parse stored project order, creating new one');
			}
		}
		
		// Create new random order and store it
		console.log('🎲 Creating new random order');
		const newOrder = shuffleArray([...projects]);
		const orderIds = newOrder.map(p => p.id);
		localStorage.setItem('projectIndexOrder', JSON.stringify(orderIds));
		console.log('💾 New order saved to localStorage:', orderIds);
		return newOrder;
	}

	// Configuration for layout randomization
	const LAYOUT_CONFIG = {
		threePortraits: { weight: 15, itemsPerRow: 3, dimension: 'portrait' as const },
		twoSquares: { weight: 12, itemsPerRow: 2, dimension: 'square' as const },
		twoLandscapes: { weight: 8, itemsPerRow: 2, dimension: 'landscape' as const },
		threeSquares: { weight: 10, itemsPerRow: 3, dimension: 'square' as const },
		fourPortraits: { weight: 20, itemsPerRow: 4, dimension: 'portrait' as const },
		oneLandscape: { weight: 20, itemsPerRow: 1, dimension: 'landscape' as const }
	};

	// Filter out featured projects to show only remaining projects
	$: remainingProjects = allProjects.filter(project => !featuredProjectIds.includes(project.id));

	// Randomize layout only when we have stable data
	$: randomizedLayout = isReady ? createRandomizedLayout(getPersistentProjectOrder(remainingProjects)) : [];

	function projectSupportsDimension(project: ProjectsDocument, dimension: 'portrait' | 'square' | 'landscape'): boolean {
		const items = Array.isArray(project.data?.preview) ? (project.data.preview as any[]) : [];
		if (dimension === 'portrait') {
			return items.some((i) => i?.preview_video_url_portrait || i?.preview_image_portrait?.url);
		}
		// Treat non-portrait (square/landscape) the same as landscape assets
		return items.some((i) => i?.preview_video_url_landscape || i?.preview_image_landscape?.url);
	}

	// Normalize layout and always set columns to match actual item count
	// Convert portrait rows with 2 items to squares and drop empty rows
	$: normalizedLayout = randomizedLayout
		.map((row): LayoutRow => {
			const supportedProjects = row.projects.filter((p) => projectSupportsDimension(p, row.dimension));
			if (row.dimension === 'portrait' && supportedProjects.length === 2) {
				return {
					...row,
					projects: supportedProjects,
					dimension: 'square',
					gridCols: getGridColsClass(2),
					configuredItemsPerRow: 2
				};
			}
			return {
				...row,
				projects: supportedProjects,
				gridCols: getGridColsClass(supportedProjects.length),
				configuredItemsPerRow: supportedProjects.length
			};
		})
		.filter((row) => row.projects.length > 0);
	
	// Debug layout rows for portrait 3 cases
	$: {
		if (randomizedLayout.length > 0) {
			randomizedLayout.forEach((row, index) => {
				if (row.dimension === 'portrait' && row.projects.length === 3) {
					console.log(`🏗️ LAYOUT ROW ${index}: 3 portrait projects | Layout: ${row.type} | Configured: ${row.configuredItemsPerRow} items | Grid: ${row.gridCols}`);
				}
			});
		}
	}

	// Watch for when data is stable and ready to display
	$: if (allProjects.length > 0 && !isReady) {
		// Initialize persistent project order
		persistentProjectOrder = getPersistentProjectOrder(remainingProjects);
		
		// Use setTimeout to ensure the layout calculation completes before showing
		setTimeout(() => {
			isReady = true;
		}, 10);
	}

	interface LayoutRow {
		type: keyof typeof LAYOUT_CONFIG;
		projects: ProjectsDocument[];
		dimension: 'portrait' | 'square' | 'landscape';
		gridCols: string;
		configuredItemsPerRow: number;
	}

	function shuffleArray<T>(array: T[]): T[] {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	function planFinalLayout(remainingProjects: ProjectsDocument[], previousLayoutType: keyof typeof LAYOUT_CONFIG | null): LayoutRow[] {
		const finalRows: LayoutRow[] = [];
		const projectsToDistribute = [...remainingProjects];
		let lastLayoutType = previousLayoutType;
		let lastItemCount: number | null = null;
		
		if (projectsToDistribute.length === 0) return finalRows;

		// If 1–4 items remain, render them in a single row to avoid partial rows
		if (projectsToDistribute.length <= 4) {
			const count = projectsToDistribute.length;
			finalRows.push({
				type: count === 1 ? 'oneLandscape' : (count === 2 ? 'twoSquares' : 'threeSquares'),
				projects: projectsToDistribute.splice(0, count),
				dimension: 'square',
				gridCols: getGridColsClass(count),
				configuredItemsPerRow: count
			});
			return finalRows;
		}
		
		// Get the last item count from the previous row to maintain alternation
		if (previousLayoutType) {
			lastItemCount = LAYOUT_CONFIG[previousLayoutType].itemsPerRow;
		}
		
		// Distribute projects to avoid lonely items while respecting constraints
		while (projectsToDistribute.length > 0) {
			let bestLayout: keyof typeof LAYOUT_CONFIG;
			let itemsToTake: number;
			
			// Available layout options based on remaining projects
			const availableOptions: Array<{layout: keyof typeof LAYOUT_CONFIG, items: number}> = [];
			
			if (projectsToDistribute.length >= 4) {
				availableOptions.push({layout: 'fourPortraits', items: 4});
			}
			if (projectsToDistribute.length >= 3) {
				availableOptions.push({layout: 'threePortraits', items: 3});
				availableOptions.push({layout: 'threeSquares', items: 3});
			}
			if (projectsToDistribute.length >= 2) {
				availableOptions.push({layout: 'twoSquares', items: 2});
				availableOptions.push({layout: 'twoLandscapes', items: 2});
			}
			if (projectsToDistribute.length >= 1) {
				availableOptions.push({layout: 'oneLandscape', items: 1});
			}
			
			// Filter options based on constraints
			const validOptions = availableOptions.filter(option => {
				// Don't repeat the same layout type
				if (lastLayoutType === option.layout) return false;
				
				// Don't repeat the same number of items (prevents vertical alignment)
				if (lastItemCount !== null && lastItemCount === option.items) return false;
				
				// Check if this choice would leave a reasonable remainder
				const remaining = projectsToDistribute.length - option.items;
				if (remaining === 1 && projectsToDistribute.length > option.items) return false;
				
				return true;
			});
			
			// Build robust fallback chain - prioritize avoiding same item count
			let finalOptions = validOptions;
			
			// First fallback: relax layout type constraint but keep item count constraint
			if (finalOptions.length === 0) {
				finalOptions = availableOptions.filter(option => {
					// Still don't repeat the same number of items
					if (lastItemCount !== null && lastItemCount === option.items) return false;
					
					// Check remainder constraint
					const remaining = projectsToDistribute.length - option.items;
					if (remaining === 1 && projectsToDistribute.length > option.items) return false;
					
					return true;
				});
			}
			
			// Second fallback: only avoid same layout type
			if (finalOptions.length === 0) {
				finalOptions = availableOptions.filter(option => {
					if (lastLayoutType === option.layout) return false;
					
					const remaining = projectsToDistribute.length - option.items;
					if (remaining === 1 && projectsToDistribute.length > option.items) return false;
					
					return true;
				});
			}
			
			// Last resort: just avoid leaving 1 item
			if (finalOptions.length === 0) {
				finalOptions = availableOptions.filter(option => {
					const remaining = projectsToDistribute.length - option.items;
					if (remaining === 1 && projectsToDistribute.length > option.items) return false;
					return true;
				});
			}
			
			// Absolute last resort: use any option
			if (finalOptions.length === 0) {
				finalOptions = availableOptions;
			}
			
			// Choose the best option (prefer larger groups when possible)
			const chosenOption = finalOptions.sort((a, b) => b.items - a.items)[0];
			
			bestLayout = chosenOption.layout;
			itemsToTake = chosenOption.items;
			
			const config = LAYOUT_CONFIG[bestLayout];
			const projectsForRow = projectsToDistribute.splice(0, Math.min(itemsToTake, projectsToDistribute.length));
			
			finalRows.push({
				type: bestLayout,
				projects: projectsForRow,
				dimension: config.dimension,
				gridCols: getGridColsClass(projectsForRow.length),
				configuredItemsPerRow: config.itemsPerRow
			});
			
			lastLayoutType = bestLayout;
			lastItemCount = projectsForRow.length;
		}
		
		return finalRows;
	}

	function createRandomizedLayout(projects: ProjectsDocument[]): LayoutRow[] {
		if (projects.length === 0) return [];

		const rows: LayoutRow[] = [];
		let remainingProjects = [...projects];
		let previousLayoutType: keyof typeof LAYOUT_CONFIG | null = null;
		let previousItemCount: number | null = null;

		// Create weighted array for random selection
		const weightedChoices: Array<{ type: keyof typeof LAYOUT_CONFIG; weight: number }> = [];
		Object.entries(LAYOUT_CONFIG).forEach(([type, config]) => {
			for (let i = 0; i < config.weight; i++) {
				weightedChoices.push({ type: type as keyof typeof LAYOUT_CONFIG, weight: config.weight });
			}
		});

		while (remainingProjects.length > 0) {
			// Filter out consecutive same layouts and same item counts (not just even/odd)
			const availableChoices = weightedChoices.filter(choice => {
				const config = LAYOUT_CONFIG[choice.type];
				const itemsNeeded = Math.min(config.itemsPerRow, remainingProjects.length);
				
				// Don't repeat the same layout type
				if (previousLayoutType === choice.type) {
					return false;
				}
				
				// Don't repeat the same number of items (this prevents vertical alignment)
				if (previousItemCount !== null && previousItemCount === itemsNeeded) {
					return false;
				}
				
				return true;
			});
			
			// Build a more robust fallback chain
			let finalChoices = availableChoices;
			
			// First fallback: relax layout type constraint but keep item count constraint
			if (finalChoices.length === 0) {
				finalChoices = weightedChoices.filter(choice => {
					const config = LAYOUT_CONFIG[choice.type];
					const itemsNeeded = Math.min(config.itemsPerRow, remainingProjects.length);
					
					// Still don't repeat the same number of items
					if (previousItemCount !== null && previousItemCount === itemsNeeded) {
						return false;
					}
					
					return true;
				});
			}
			
			// Second fallback: only avoid same layout type  
			if (finalChoices.length === 0) {
				finalChoices = weightedChoices.filter(choice => previousLayoutType !== choice.type);
			}
			
			// Last resort: use any choice
			if (finalChoices.length === 0) {
				finalChoices = weightedChoices;
			}
			
			// Check if we should plan the final rows to avoid lonely items
			if (remainingProjects.length <= 7) {
				console.log(`🔥 SWITCHING TO FINAL LAYOUT PLANNING: ${remainingProjects.length} projects remaining`);
				// Plan the final layout to avoid lonely items
				const finalRows = planFinalLayout(remainingProjects, previousLayoutType);
				console.log(`🔥 FINAL LAYOUT PLANNED: ${finalRows.length} rows created`);
				finalRows.forEach((row, index) => {
					console.log(`🔥 FINAL ROW ${index}: ${row.projects.length} ${row.dimension} projects | Layout: ${row.type} | Configured: ${row.configuredItemsPerRow} items`);
				});
				rows.push(...finalRows);
				break;
			}
			
			// Randomly select layout type from available choices
			const randomChoice = finalChoices[Math.floor(Math.random() * finalChoices.length)];
			const layoutType = randomChoice.type;
			const config = LAYOUT_CONFIG[layoutType];

			// Check if taking this many items would leave a bad remainder
			const projectsNeeded = Math.min(config.itemsPerRow, remainingProjects.length);
			const wouldRemain = remainingProjects.length - projectsNeeded;
			
			// If this would leave 1 lonely item, try to adjust
			if (wouldRemain === 1) {
				// Try to take one less item to leave 2, or find a different layout
				if (projectsNeeded > 1) {
					// Take one less item for this row
					const adjustedProjectsForRow = remainingProjects.splice(0, projectsNeeded - 1);
					const adjustedGridCols = getGridColsClass(adjustedProjectsForRow.length);
					
					rows.push({
						type: layoutType,
						projects: adjustedProjectsForRow,
						dimension: config.dimension,
						gridCols: adjustedGridCols,
						configuredItemsPerRow: config.itemsPerRow
					});
					previousLayoutType = layoutType;
					previousItemCount = adjustedProjectsForRow.length;
					continue;
				} else {
					// Find a different layout that takes more items and follows our constraints
					const betterChoices = finalChoices.filter(choice => {
						const choiceConfig = LAYOUT_CONFIG[choice.type];
						const needed = Math.min(choiceConfig.itemsPerRow, remainingProjects.length);
						const remaining = remainingProjects.length - needed;
						
						// Prioritize avoiding same item count
						if (previousItemCount !== null && previousItemCount === needed) {
							return false;
						}
						
						return remaining !== 1 && needed <= remainingProjects.length;
					});
					
					// If no choices avoid same item count, try without that constraint
					const fallbackBetterChoices = betterChoices.length > 0 ? betterChoices :
						finalChoices.filter(choice => {
							const choiceConfig = LAYOUT_CONFIG[choice.type];
							const needed = Math.min(choiceConfig.itemsPerRow, remainingProjects.length);
							const remaining = remainingProjects.length - needed;
							return remaining !== 1 && needed <= remainingProjects.length;
						});
					
					if (fallbackBetterChoices.length > 0) {
						const betterChoice = fallbackBetterChoices[Math.floor(Math.random() * fallbackBetterChoices.length)];
						const betterConfig = LAYOUT_CONFIG[betterChoice.type];
						const betterProjectsForRow = remainingProjects.splice(0, Math.min(betterConfig.itemsPerRow, remainingProjects.length));
						
						rows.push({
							type: betterChoice.type,
							projects: betterProjectsForRow,
							dimension: betterConfig.dimension,
							gridCols: getGridColsClass(betterConfig.itemsPerRow),
							configuredItemsPerRow: betterConfig.itemsPerRow
						});
						previousLayoutType = betterChoice.type;
						previousItemCount = betterProjectsForRow.length;
						continue;
					}
				}
			}

			// Take projects for this row
			const projectsForRow = remainingProjects.splice(0, projectsNeeded);
			
			// Skip if we don't have enough projects for the selected layout (except for the last row)
			if (projectsForRow.length < config.itemsPerRow && remainingProjects.length > 0) {
				// Put projects back and try a layout that fits
				remainingProjects.unshift(...projectsForRow);
				
				// Find a layout that fits the remaining projects and follows our constraints
				const availableLayouts = Object.entries(LAYOUT_CONFIG).filter(([type, layoutConfig]) => {
					const itemsNeeded = Math.min(layoutConfig.itemsPerRow, remainingProjects.length);
					
					// Must have enough projects
					if (layoutConfig.itemsPerRow > remainingProjects.length) return false;
					
					// Don't repeat same layout type
					if (previousLayoutType === type) return false;
					
					// Don't repeat same number of items
					if (previousItemCount !== null && previousItemCount === itemsNeeded) return false;
					
					return true;
				});
				
				// Fallback: if no layouts fit our constraints, just avoid same layout type
				const fallbackLayouts = availableLayouts.length > 0 ? availableLayouts :
					Object.entries(LAYOUT_CONFIG).filter(([type, layoutConfig]) => 
						layoutConfig.itemsPerRow <= remainingProjects.length && previousLayoutType !== type
					);
				
				if (fallbackLayouts.length === 0) {
					// If no layout fits, use the final layout planner
					const finalRows = planFinalLayout(remainingProjects, previousLayoutType);
					rows.push(...finalRows);
					break;
				}
				
				// Select randomly from available layouts, but check for lonely items
				const goodLayouts = fallbackLayouts.filter(([_, layoutConfig]) => {
					const needed = layoutConfig.itemsPerRow;
					const remaining = remainingProjects.length - needed;
					return remaining !== 1;
				});
				
				const layoutsToChooseFrom = goodLayouts.length > 0 ? goodLayouts : fallbackLayouts;
				const [selectedType, selectedConfig] = layoutsToChooseFrom[Math.floor(Math.random() * layoutsToChooseFrom.length)];
				const selectedProjects = remainingProjects.splice(0, selectedConfig.itemsPerRow);
				
				rows.push({
					type: selectedType as keyof typeof LAYOUT_CONFIG,
					projects: selectedProjects,
					dimension: selectedConfig.dimension,
					gridCols: getGridColsClass(selectedConfig.itemsPerRow),
					configuredItemsPerRow: selectedConfig.itemsPerRow
				});
				previousLayoutType = selectedType as keyof typeof LAYOUT_CONFIG;
				previousItemCount = selectedProjects.length;
			} else {
				// Add the row
				rows.push({
					type: layoutType,
					projects: projectsForRow,
					dimension: config.dimension,
					gridCols: getGridColsClass(config.itemsPerRow),
					configuredItemsPerRow: config.itemsPerRow
				});
				previousLayoutType = layoutType;
				previousItemCount = projectsForRow.length;
			}
		}

		return rows;
	}

	function getGridColsClass(itemsPerRow: number): string {
		switch (itemsPerRow) {
			case 1: return 'grid-cols-1';
			case 2: return 'grid-cols-2';
			case 3: return 'grid-cols-3';
			case 4: return 'grid-cols-4';
			default: return 'grid-cols-3';
		}
	}
</script>

<div>
	{#if isReady && normalizedLayout.length > 0}
		<div class="space-y-2">
			{#each normalizedLayout as row}
				<div class="grid dimension-{row.dimension} {row.gridCols} gap-2">
					{#each row.projects as project}
						<ProjectItem dimension={row.dimension} itemsPerRow={row.configuredItemsPerRow} {project} />
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>




