<script lang="ts">
	import BigWheel from '$lib/components/BigWheel.svelte';
</script>

<svelte:head>
	<title>Circle Generator - Admin</title>
</svelte:head>

<div class="w-full">
	<BigWheel config={{ uiVisible: true }} />
</div>
