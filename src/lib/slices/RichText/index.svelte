<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { PrismicRichText, type SliceComponentProps } from '@prismicio/svelte';

	type Props = SliceComponentProps<Content.RichTextSlice>;

	const { slice }: Props = $props();
</script>

<section class="px-3 max-w-8/12 mx-auto pb-24">
	<PrismicRichText
		field={slice.primary.content} />
</section>
