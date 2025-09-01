<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import { PrismicLink } from '@prismicio/svelte';
	import { createClient } from '$lib/prismicio';
	import { asLink } from '@prismicio/client';
	import { onMount } from 'svelte';
 	import { isFilled } from '@prismicio/client';

	type Props = SliceComponentProps<Content.FeatureListSlice>;

	const { slice }: Props = $props();

	let collaborators = $state<{ name: string; url: string | null }[]>([]);
	let collabLeft = $state<typeof collaborators>([]);
	let collabRight = $state<typeof collaborators>([]);

	function splitIntoTwo<T>(arr: T[]): [T[], T[]] {
		const mid = Math.ceil(arr.length / 2);
		return [arr.slice(0, mid), arr.slice(mid)];
	}

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
			[collabLeft, collabRight] = splitIntoTwo(collaborators);
		}
	});

	const manualLinks = (slice.primary.items as any[]) || [];
	const manualMid = Math.ceil(manualLinks.length / 2);
	const manualLeft = manualLinks.slice(0, manualMid);
	const manualRight = manualLinks.slice(manualMid);
</script>

<section class="mb-8 mt-6 content-container paragraph-1" data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	{#if slice.primary.take_collaborators_automatically}
		{#if collaborators.length}
			<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
				<div class="text-center md:text-left font-normal">{isFilled.keyText(slice.primary.title) ? slice.primary.title : ''}</div>
				<div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 text-black hover:text-gray-400">
					<ul>
						{#each collabLeft as person}
							<li class="hover:text-black transition-colors duration-200">
								{#if person.url}
									<a href={person.url} target="_blank" rel="noreferrer">{person.name}</a>
								{:else}
									<span>{person.name}</span>
								{/if}
							</li>
						{/each}
					</ul>
					<ul>
						{#each collabRight as person}
							<li class="hover:text-black transition-colors duration-200">
								{#if person.url}
									<a href={person.url} target="_blank" rel="noreferrer">{person.name}</a>
								{:else}
									<span>{person.name}</span>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			</div>
		{/if}
	{:else}
		{#if manualLinks.length}
			<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
				<div class="text-center md:text-left font-normal">{isFilled.keyText(slice.primary.title) ? slice.primary.title : ''}</div>
				<div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 text-black hover:text-gray-400">
					<ul>
						{#each manualLeft as link}
							<li class="hover:text-black transition-colors duration-200">
								<PrismicLink field={link} />
							</li>
						{/each}
					</ul>
					<ul>
						{#each manualRight as link}
							<li class="hover:text-black transition-colors duration-200">
								<PrismicLink field={link} />
							</li>
						{/each}
					</ul>
				</div>
			</div>
		{/if}
	{/if}
</section>
