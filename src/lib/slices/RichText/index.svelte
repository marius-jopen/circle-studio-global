<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { PrismicRichText, type SliceComponentProps } from '@prismicio/svelte';

	type Props = SliceComponentProps<Content.RichTextSlice>;

	const { slice }: Props = $props();
</script>

<section class="content-container mb-8 mt-6">
	<PrismicRichText
		field={slice.primary.content} />
</section>
