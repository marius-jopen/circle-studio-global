<script lang="ts">
	import { verifyPassword, setAuth } from '$lib/utils/auth';
	import { onMount } from 'svelte';

	let password = $state('');
	let error = $state('');

	// Redirect if already authenticated
	onMount(() => {
		if (typeof window !== 'undefined' && sessionStorage.getItem('admin_auth') === 'true') {
			window.location.href = '/admin';
		}
	});

	function handleLogin(e: Event) {
		e.preventDefault();
		error = '';

		if (verifyPassword(password)) {
			setAuth();
			window.location.href = '/admin';
		} else {
			error = 'Incorrect password';
		}
	}
</script>

<svelte:head>
	<title>Admin Login - Art Camp</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="max-w-md w-full space-y-8 p-8">
		<div>
			<h1 class="text-3xl font-bold text-center text-gray-900">Admin Login</h1>
			<p class="mt-2 text-center text-sm text-gray-600">Enter password to access admin area</p>
		</div>
		<form onsubmit={handleLogin} class="mt-8 space-y-6">
			<div>
				<label for="password" class="sr-only">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					bind:value={password}
					class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
					placeholder="Password"
					autocomplete="current-password"
				/>
			</div>

			{#if error}
				<div class="text-red-600 text-sm text-center">{error}</div>
			{/if}

			<div>
				<button
					type="submit"
					class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
				>
					Login
				</button>
			</div>
		</form>
	</div>
</div>
