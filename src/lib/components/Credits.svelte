<script lang="ts">
	import { PrismicLink } from '@prismicio/svelte';
	
	interface Props {
		credits: any;
	}
	
	const { credits }: Props = $props();
</script>

{#if credits && credits.length > 0}
	<section class="mb-12">
		<h2 class="text-center font-normal mb-8 ">Credits</h2>
		<div class="">
			{#each credits as credit}
				{#if credit.label && credit.person && credit.person.length > 0}
					<div class="flex justify-between gap-3">
						<span class="text-right w-full">{credit.label}</span>
						<span class="w-full">
							{#each credit.person as person, index}
								<PrismicLink field={person} class="hover:underline">
									{(person as any).data?.name || `Person ${index + 1}`} 
								</PrismicLink>{#if index < credit.person.length - 1},&nbsp;{/if}
							{/each}
						</span>
					</div>
				{/if}
			{/each}
		</div>
	</section>
{/if} 