<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Admin Dashboard</title>
</svelte:head>

<div class="max-w-7xl mx-auto">
	<h1 class="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
	
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<a
			href="/admin/circle-batch-generator"
			class="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
		>
			<h2 class="text-xl font-semibold text-gray-900 mb-2">Circle Generator</h2>
			<p class="text-gray-600">Create animated circular text</p>
		</a>
		
		<a
			href="/admin/settings"
			class="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
		>
			<h2 class="text-xl font-semibold text-gray-900 mb-2">Settings</h2>
			<p class="text-gray-600">Manage application settings</p>
		</a>
	</div>
</div>
