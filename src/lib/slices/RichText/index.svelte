<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { type SliceComponentProps } from '@prismicio/svelte';
	import { asText } from '@prismicio/client';

	type Props = SliceComponentProps<Content.RichTextSlice>;

	const { slice }: Props = $props();
</script>

<section class="content-container mb-8 mt-6 text-left md:text-center text-sm md:text-base opacity-40 md:opacity-100">
	<div class="text-2xl md:h1 py-2 md:py-0">
		{asText(slice.primary.content)}
	</div>
</section>
