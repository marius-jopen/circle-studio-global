<script lang="ts">
	import AdminNav from '$lib/components/AdminNav.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { isAuthenticated } from '$lib/utils/auth';
	
	let { children } = $props();

	onMount(() => {
		// Simple client-side auth check
		if (!isAuthenticated()) {
			window.location.href = '/login';
		}
	});
</script>

<div class="min-h-screen bg-gray-50">
	<AdminNav />
	<main class="p-8">
		{@render children()}
	</main>
</div>
