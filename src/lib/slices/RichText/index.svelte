<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { type SliceComponentProps } from '@prismicio/svelte';
	import { asText } from '@prismicio/client';

	type Props = SliceComponentProps<Content.RichTextSlice>;

	const { slice }: Props = $props();
</script>

<section class="content-container mb-8 mt-6 text-left md:text-center  text-primary">
	<div class="h0 py-2 md:py-0">
		{asText(slice.primary.content)}
	</div>
</section>
