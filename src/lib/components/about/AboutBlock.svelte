<script lang="ts">
	import type { AboutBlock, BlockSize } from '$lib/types/aboutBlock';
	import CircleBlock from './blocks/CircleBlock.svelte';
	import GalleryBlock from './blocks/GalleryBlock.svelte';
	import CollaboratorsBlock from './blocks/CollaboratorsBlock.svelte';
	import PressBlock from './blocks/PressBlock.svelte';

	export let block: AboutBlock;
	export let size: BlockSize | undefined = undefined;
	void size;
</script>

<!-- hideOnMobile is handled by the cell wrapper in AboutLayoutRenderer (hidden md:block). -->
{#if block.type === 'circle'}
	<CircleBlock {block} />
{:else if block.type === 'gallery'}
	<GalleryBlock {block} />
{:else if block.type === 'collaborators'}
	<CollaboratorsBlock {block} />
{:else if block.type === 'press'}
	<PressBlock {block} />
{/if}
