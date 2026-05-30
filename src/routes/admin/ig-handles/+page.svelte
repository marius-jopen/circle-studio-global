<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { createClient } from '$lib/prismicio';

	// State
	let projects = $state<any[]>([]);
	let selectedProjectUid = $state('');
	let selectedProject = $state<any>(null);
	let loading = $state(false);
	let copied = $state(false);

	type Entry = { handle: string | null; name: string };
	type Row = { label: string; entries: Entry[] };

	let rows = $state<Row[]>([]);
	// Editable caption text — hand-editable after it's generated from credits.
	let editableText = $state('');

	onMount(async () => {
		const client = createClient();
		const allProjects = await client.getAllByType('projects', { pageSize: 100 });
		projects = allProjects.sort((a, b) => {
			const titleA = (a.data.title as string) || '';
			const titleB = (b.data.title as string) || '';
			return titleA.localeCompare(titleB);
		});
	});

	// Extract an Instagram @handle from a person's link. Returns null when the
	// link is missing or isn't an Instagram URL — so it can be flagged for
	// manual fill-in.
	function extractIgHandle(link: any): string | null {
		const url: string = link?.url || (typeof link === 'string' ? link : '');
		if (!url) return null;
		try {
			const u = new URL(url);
			if (!/(^|\.)instagram\.com$/i.test(u.hostname)) return null;
			const seg = u.pathname.split('/').filter(Boolean)[0];
			if (!seg) return null;
			return '@' + seg.replace(/^@/, '');
		} catch {
			return null;
		}
	}

	// Plain-text caption, grouped by label. Missing handles become a
	// bracketed placeholder naming the person so they can be filled in.
	function buildCaption(source: Row[]): string {
		return source
			.map((r) => {
				const parts = r.entries.map((e) => e.handle ?? `[FILL IN: ${e.name}]`);
				return `${r.label}: ${parts.join(' ')}`;
			})
			.join('\n');
	}

	async function onProjectChange() {
		copied = false;
		rows = [];
		editableText = '';
		selectedProject = null;
		if (!selectedProjectUid || !browser) return;

		loading = true;
		try {
			const client = createClient();
			// fetchLinks pulls the title + link off each linked people document.
			const project = await client.getByUID('projects', selectedProjectUid, {
				fetchLinks: ['people.title', 'people.link']
			});
			selectedProject = project;

			const credits = (project.data.credits as any[]) ?? [];
			rows = credits
				.filter((c) => c?.label && Array.isArray(c.person) && c.person.length > 0)
				.map((c) => ({
					label: c.label as string,
					entries: (c.person as any[]).map((person) => {
						const data = person?.data;
						return {
							handle: extractIgHandle(data?.link),
							name: data?.title || 'Unknown person'
						} as Entry;
					})
				}));
			editableText = buildCaption(rows);
		} finally {
			loading = false;
		}
	}

	// Count of people in this project missing an IG link.
	let missingCount = $derived(
		rows.reduce((sum, r) => sum + r.entries.filter((e) => !e.handle).length, 0)
	);

	function resetCaption() {
		editableText = buildCaption(rows);
		copied = false;
	}

	async function copyCaption() {
		if (!editableText || !browser) return;
		await navigator.clipboard.writeText(editableText);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<svelte:head>
	<title>IG Handles</title>
</svelte:head>

<div class="max-w-7xl mx-auto">
	<div class="grid grid-cols-[300px_1fr] gap-6">
		<!-- Left: Controls -->
		<div class="flex flex-col gap-4">
			<h1 class="text-xl font-bold text-gray-900">IG Handles</h1>

			<!-- Project selector -->
			<div>
				<label for="project-select" class="block text-xs font-medium text-gray-500 mb-1"
					>Project</label
				>
				<select
					id="project-select"
					bind:value={selectedProjectUid}
					onchange={onProjectChange}
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
				>
					<option value="">Select a project...</option>
					{#each projects as project}
						<option value={project.uid}>{project.data.title || project.uid}</option>
					{/each}
				</select>
			</div>

			<!-- Copy button -->
			<button
				onclick={copyCaption}
				disabled={rows.length === 0}
				class="rounded-md bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
			>
				{copied ? 'Copied!' : 'Copy all handles'}
			</button>

			<!-- Reset button -->
			<button
				onclick={resetCaption}
				disabled={rows.length === 0}
				class="rounded-md border border-gray-300 text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
			>
				Reset to credits
			</button>

			<!-- Stats -->
			{#if selectedProject}
				<div class="text-xs text-gray-400 mt-1 space-y-1">
					<div><span class="text-gray-500">Project:</span> {selectedProject.data?.title || '—'}</div>
					<div><span class="text-gray-500">Credit rows:</span> {rows.length}</div>
					{#if missingCount > 0}
						<div class="text-red-500">
							{missingCount} person{missingCount === 1 ? '' : 's'} missing an IG link
						</div>
					{:else if rows.length > 0}
						<div class="text-green-600">All credited people have an IG link</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Right: Editable output -->
		<div class="flex flex-col gap-2">
			{#if loading}
				<div
					class="rounded-lg bg-gray-100 text-gray-400 p-6 min-h-[400px] text-base"
				>
					Loading credits…
				</div>
			{:else if !selectedProject}
				<div
					class="rounded-lg bg-gray-100 text-gray-400 p-6 min-h-[400px] text-base"
				>
					Select a project to extract its Instagram handles.
				</div>
			{:else if rows.length === 0}
				<div
					class="rounded-lg bg-gray-100 text-gray-400 p-6 min-h-[400px] text-base"
				>
					This project has no credits.
				</div>
			{:else}
				<textarea
					bind:value={editableText}
					spellcheck="false"
					oninput={() => (copied = false)}
					class="w-full rounded-lg bg-gray-100 text-gray-900 p-6 min-h-[400px] text-sm leading-relaxed font-mono resize-y focus:outline-none focus:ring-2 focus:ring-gray-400/50"
				></textarea>
				<p class="text-xs text-gray-400">
					Edit freely — add or fix handles by hand. <span class="text-red-500"
						>[FILL IN: …]</span
					> markers show people with no Instagram link. Use “Reset to credits” to regenerate.
				</p>
			{/if}
		</div>
	</div>
</div>
