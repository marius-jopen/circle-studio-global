<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import { PrismicLink } from '@prismicio/svelte';
	import { createClient } from '$lib/prismicio';
	import { asLink } from '@prismicio/client';
	import { onMount } from 'svelte';

	type Props = SliceComponentProps<Content.FeatureListSlice>;

	const { slice }: Props = $props();

	let collaborators = $state<{ name: string; url: string | null }[]>([]);

	onMount(async () => {
		if (slice.primary.take_collaborators_automatically) {
			const client = createClient();
			const docs = await client.getAllByType('people', {
				orderings: [{ field: 'my.people.name', direction: 'asc' }],
				pageSize: 200
			});
			collaborators = docs.map((d) => ({
				name: (d.data.name as string) || d.uid,
				url: asLink(d.data.link)
			}));
		}
	});
</script>

<section data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	{#if slice.primary.take_collaborators_automatically}
		{#if collaborators.length}
			<ul class="text-black hover:text-gray-400">
				{#each collaborators as person}
					<li class="hover:text-black transition-colors duration-200">
						{#if person.url}
							<a href={person.url} target="_blank" rel="noreferrer">{person.name}</a>
						{:else}
							<span>{person.name}</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{:else}
		{#if slice.primary.items?.length}
			<ul class="text-black hover:text-gray-400">
				{#each slice.primary.items as link}
					<li class="hover:text-black transition-colors duration-200">
						<PrismicLink field={link} />
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</section>
