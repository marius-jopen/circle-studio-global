<script lang="ts">
	import type { ProjectsDocument } from '../../prismicio-types';
	import ProjectItem from './projectItem.svelte';

	export let allProjects: ProjectsDocument[] = [];
	export let featuredProjectIds: string[] = [];

	// Configuration for layout randomization
	const LAYOUT_CONFIG = {
		threePortraits: { weight: 40, itemsPerRow: 3, dimension: 'portrait' as const },
		twoSquares: { weight: 30, itemsPerRow: 2, dimension: 'square' as const },
		fourPortraits: { weight: 15, itemsPerRow: 4, dimension: 'portrait' as const },
		oneLandscape: { weight: 15, itemsPerRow: 1, dimension: 'landscape' as const }
	};

	// Filter out featured projects to show only remaining projects
	$: remainingProjects = allProjects.filter(project => !featuredProjectIds.includes(project.id));

	// Randomize layout on component mount and when projects change
	$: randomizedLayout = createRandomizedLayout(remainingProjects);

	interface LayoutRow {
		type: keyof typeof LAYOUT_CONFIG;
		projects: ProjectsDocument[];
		dimension: 'portrait' | 'square' | 'landscape';
		gridCols: string;
	}

	function planFinalLayout(remainingProjects: ProjectsDocument[], previousLayoutType: keyof typeof LAYOUT_CONFIG | null): LayoutRow[] {
		const finalRows: LayoutRow[] = [];
		const projectsToDistribute = [...remainingProjects];
		
		if (projectsToDistribute.length === 0) return finalRows;
		
		// Distribute projects to avoid lonely items
		while (projectsToDistribute.length > 0) {
			let bestLayout: keyof typeof LAYOUT_CONFIG;
			let itemsToTake: number;
			
			if (projectsToDistribute.length >= 4) {
				// Take 4 if possible (fourPortraits)
				bestLayout = 'fourPortraits';
				itemsToTake = 4;
			} else if (projectsToDistribute.length === 3) {
				// Take 3 (threePortraits)
				bestLayout = 'threePortraits';
				itemsToTake = 3;
			} else if (projectsToDistribute.length === 2) {
				// Take 2 (twoSquares)
				bestLayout = 'twoSquares';
				itemsToTake = 2;
			} else {
				// Only 1 left - this shouldn't happen with our logic, but handle it
				bestLayout = 'threePortraits';
				itemsToTake = 1;
			}
			
			// Note: We avoid oneLandscape in final planning to prevent lonely items
			// The bestLayout choices above already ensure good distribution
			
			const config = LAYOUT_CONFIG[bestLayout];
			const projectsForRow = projectsToDistribute.splice(0, Math.min(itemsToTake, projectsToDistribute.length));
			
			finalRows.push({
				type: bestLayout,
				projects: projectsForRow,
				dimension: config.dimension,
				gridCols: getGridColsClass(projectsForRow.length)
			});
			
			previousLayoutType = bestLayout;
		}
		
		return finalRows;
	}

	function createRandomizedLayout(projects: ProjectsDocument[]): LayoutRow[] {
		if (projects.length === 0) return [];

		const rows: LayoutRow[] = [];
		let remainingProjects = [...projects];
		let previousLayoutType: keyof typeof LAYOUT_CONFIG | null = null;

		// Create weighted array for random selection
		const weightedChoices: Array<{ type: keyof typeof LAYOUT_CONFIG; weight: number }> = [];
		Object.entries(LAYOUT_CONFIG).forEach(([type, config]) => {
			for (let i = 0; i < config.weight; i++) {
				weightedChoices.push({ type: type as keyof typeof LAYOUT_CONFIG, weight: config.weight });
			}
		});

		while (remainingProjects.length > 0) {
			// Filter out consecutive landscape layouts
			const availableChoices = weightedChoices.filter(choice => 
				!(previousLayoutType === 'oneLandscape' && choice.type === 'oneLandscape')
			);
			
			// Check if we should plan the final rows to avoid lonely items
			if (remainingProjects.length <= 7) {
				// Plan the final layout to avoid lonely items
				const finalRows = planFinalLayout(remainingProjects, previousLayoutType);
				rows.push(...finalRows);
				break;
			}
			
			// Randomly select layout type from available choices
			const randomChoice = availableChoices[Math.floor(Math.random() * availableChoices.length)];
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
						gridCols: adjustedGridCols
					});
					previousLayoutType = layoutType;
					continue;
				} else {
					// Find a different layout that takes more items
					const betterChoices = availableChoices.filter(choice => {
						const choiceConfig = LAYOUT_CONFIG[choice.type];
						const needed = Math.min(choiceConfig.itemsPerRow, remainingProjects.length);
						const remaining = remainingProjects.length - needed;
						return remaining !== 1 && needed <= remainingProjects.length;
					});
					
					if (betterChoices.length > 0) {
						const betterChoice = betterChoices[Math.floor(Math.random() * betterChoices.length)];
						const betterConfig = LAYOUT_CONFIG[betterChoice.type];
						const betterProjectsForRow = remainingProjects.splice(0, Math.min(betterConfig.itemsPerRow, remainingProjects.length));
						
						rows.push({
							type: betterChoice.type,
							projects: betterProjectsForRow,
							dimension: betterConfig.dimension,
							gridCols: getGridColsClass(betterConfig.itemsPerRow)
						});
						previousLayoutType = betterChoice.type;
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
				
				// Find a layout that fits the remaining projects
				const availableLayouts = Object.entries(LAYOUT_CONFIG).filter(([_, layoutConfig]) => 
					layoutConfig.itemsPerRow <= remainingProjects.length
				);
				
				if (availableLayouts.length === 0) {
					// If no layout fits, use the final layout planner
					const finalRows = planFinalLayout(remainingProjects, previousLayoutType);
					rows.push(...finalRows);
					break;
				}
				
				// Select randomly from available layouts, but check for lonely items
				const goodLayouts = availableLayouts.filter(([_, layoutConfig]) => {
					const needed = layoutConfig.itemsPerRow;
					const remaining = remainingProjects.length - needed;
					return remaining !== 1;
				});
				
				const layoutsToChooseFrom = goodLayouts.length > 0 ? goodLayouts : availableLayouts;
				const [selectedType, selectedConfig] = layoutsToChooseFrom[Math.floor(Math.random() * layoutsToChooseFrom.length)];
				const selectedProjects = remainingProjects.splice(0, selectedConfig.itemsPerRow);
				
				rows.push({
					type: selectedType as keyof typeof LAYOUT_CONFIG,
					projects: selectedProjects,
					dimension: selectedConfig.dimension,
					gridCols: getGridColsClass(selectedConfig.itemsPerRow)
				});
				previousLayoutType = selectedType as keyof typeof LAYOUT_CONFIG;
			} else {
				// Add the row
				rows.push({
					type: layoutType,
					projects: projectsForRow,
					dimension: config.dimension,
					gridCols: getGridColsClass(config.itemsPerRow)
				});
				previousLayoutType = layoutType;
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
	{#if randomizedLayout.length > 0}
		<div class="space-y-4">
			{#each randomizedLayout as row}
				<div class="grid {row.gridCols} gap-4">
					{#each row.projects as project}
						<ProjectItem dimension={row.dimension} {project} />
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>


