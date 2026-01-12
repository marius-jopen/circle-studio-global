<script lang="ts">
	import AdminNav from '$lib/components/AdminNav.svelte';
	import { page } from '$app/stores';
	
	let { children } = $props();
</script>

<div class="min-h-screen bg-gray-50">
	<AdminNav />
	<main class="p-8">
		{@render children()}
	</main>
</div>
