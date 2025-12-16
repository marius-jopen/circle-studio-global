<script lang="ts">
	import { PrismicLink } from '@prismicio/svelte';
	
	interface Props {
		credits: any;
	}
	
	const { credits }: Props = $props();
</script>

{#if credits && credits.length > 0}
	{@const validCredits = credits.filter((credit: { label?: string; person?: any[] }) => credit.label && credit.person && credit.person.length > 0)}
	{#if validCredits.length > 0}
		<section class="mb-12 mt-8">
			<div class="text-center font-normal mb-4 ">Credits</div>
				<div class="text-black hover:text-black/25">
					{#each validCredits as credit}
					<div class="flex justify-between gap-3 pb-1 hover:text-black transition-colors duration-200">
						<span class="text-right w-full">{credit.label}</span>
						<span class="w-full">
						{#each credit.person as person, index}
							{@const personData = person.data}
							{@const linkUrl = personData?.link?.url || personData?.link}
							<span class="person-entry">
								{#if linkUrl}
									<a class="hover:underline decoration-[1px] underline-offset-3" href={linkUrl} target="_blank">
										{personData?.title || `Person ${index + 1}`}
									</a>
								{:else}
									<span>
										{personData?.title || `Person ${index + 1}`}
									</span>
								{/if}
							</span>
						{/each}
						</span>
					</div>
				{/each}
			</div>
		</section>
	{/if}
{/if} 
<style>
  .person-entry:not(:last-child)::after { content: ', '; }
</style>