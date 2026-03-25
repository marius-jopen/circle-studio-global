<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import { isFilled, asLink } from '@prismicio/client';
	import { aboutContentVisible } from '$lib/stores';

	type Props = SliceComponentProps<Content.ContactUsHeaderSlice>;

	const { slice }: Props = $props();

	let copied = $state(false);
	let linkUrl = $derived(asLink(slice.primary.link) || '');
	let emailDisplay = $derived(
		linkUrl.startsWith('mailto:') ? linkUrl.replace(/^mailto:/i, '').trim() : linkUrl
	);
	let buttonText = $derived(slice.primary.link?.text?.trim() || emailDisplay);

	async function handleClick(e: MouseEvent) {
		e.preventDefault();

		if (!linkUrl) return;

		try {
			await navigator.clipboard.writeText(emailDisplay);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 4000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
</script>

{#if isFilled.link(slice.primary.link)}
	<div
		class="fixed z-[10002] pointer-events-auto left-1/2 top-4 -translate-x-1/2 max-md:left-auto max-md:right-[14px] max-md:top-[6px] max-md:translate-x-0"
		data-slice-type={slice.slice_type}
		data-slice-variation={slice.variation}
	>
		<button
			onclick={handleClick}
			class="rounded-md px-4 py-1.5 max-md:min-h-10 max-md:flex max-md:items-center text-sm max-md:text-base font-medium text-neutral-900 hover:text-neutral-600 transition-colors {$aboutContentVisible ? 'bg-gray-100' : 'bg-white'}"
		>
			{#if copied}
				<span class="text-center max-md:text-right max-md:leading-relaxed max-md:py-1">
					<span class="md:hidden">{emailDisplay}<br>copied to clipboard.</span>
					<span class="hidden md:inline">{emailDisplay} copied to clipboard.</span>
				</span>
			{:else}
				{buttonText}
			{/if}
		</button>
	</div>
{/if}
