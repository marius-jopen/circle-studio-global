<script lang="ts">
	import { goto } from '$app/navigation';
	import { verifyPassword } from '$lib/utils/auth';
	import { invalidateAll } from '$app/navigation';

	let password = $state('');
	let error = $state('');
	let isLoading = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		console.log('Login form submitted, password length:', password.length);
		error = '';
		isLoading = true;

		// Always verify on server side, don't check client-side first
		try {
			// Set cookie via API
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ password }),
				credentials: 'include' // Important: include cookies
			});

			console.log('Login response status:', response.status);

			if (response.ok) {
				const data = await response.json().catch(() => ({}));
				console.log('Login successful, redirecting...');
				await invalidateAll();
				goto('/admin');
			} else {
				const data = await response.json().catch(() => ({}));
				error = data.error || 'Login failed. Please try again.';
				console.error('Login failed:', response.status, data);
			}
		} catch (err) {
			console.error('Login error:', err);
			error = 'An error occurred. Please check your connection and try again.';
		} finally {
			isLoading = false;
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
					disabled={isLoading}
				/>
			</div>

			{#if error}
				<div class="text-red-600 text-sm text-center">{error}</div>
			{/if}

			<div>
				<button
					type="submit"
					disabled={isLoading}
					class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading ? 'Logging in...' : 'Login'}
				</button>
			</div>
		</form>
	</div>
</div>
