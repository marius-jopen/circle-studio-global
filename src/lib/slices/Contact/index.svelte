<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import { isFilled, asLink } from '@prismicio/client';

	type Props = SliceComponentProps<Content.ContactSlice>;

	const { slice }: Props = $props();

	let copied = $state(false);
	let linkUrl = $derived(asLink(slice.primary.link) || '');
	let linkText = $derived(slice.primary.link?.text || linkUrl || '');

	async function handleClick(e: MouseEvent) {
		e.preventDefault();
		
		if (!linkUrl) return;

		try {
			await navigator.clipboard.writeText(linkUrl);
			copied = true;
			
			// Reset after 2 seconds
			setTimeout(() => {
				copied = false;
			}, 4000);
		} catch (err) {
			console.error('Failed to copy link:', err);
		}
	}
</script>

<section class="mb-2 -mt-1 text-center bg-neutral-100 rounded px-4 py-28" data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	{#if isFilled.link(slice.primary.link)}
		<button
			onclick={handleClick}
			class="h1 text-center w-full contact-link-wrapper cursor-pointer h-[100px] flex items-center flex-row justify-center"
		>
			{#if copied}
			<div class="text-lg">
				{linkUrl} copied to clipboard. <br />
				Paste it into your e-mail.
			</div>
			{:else}
				<span class=" hover:text-neutral-400 transition-colors duration-200">
					{linkText}
				</span>
			{/if}
		</button>
	{/if}
</section>

<style>
	.contact-link-wrapper {
		background: none;
		border: none;
		padding: 0;
		font-weight: inherit;
		line-height: inherit;
		font-family: inherit;
		/* Let h1 class handle font-size */
	}
	
	/* Ensure button itself doesn't have hover color changes */
	.contact-link-wrapper:hover {
		color: inherit;
	}
</style>
