<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';

	const navItems = [
		{ label: 'Circle Generator', path: '/admin/circle-batch-generator' },
		{ label: 'Batch Generator', path: '/admin/batch-generator' },
		{ label: 'Settings', path: '/admin/settings' }
	];

	async function handleLogout() {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			await invalidateAll();
			goto('/login');
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}

	$: currentPath = $page.url.pathname;
</script>

<nav class="bg-white border-b border-gray-200">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between h-16">
			<div class="flex">
				<div class="flex-shrink-0 flex items-center">
					<span class="text-xl font-bold text-gray-900">Admin</span>
				</div>
				<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
					{#each navItems as item}
						<a
							href={item.path}
							class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
							class:border-gray-900={currentPath === item.path}
							class:text-gray-900={currentPath === item.path}
							class:border-transparent={currentPath !== item.path}
							class:text-gray-500={currentPath !== item.path}
							class:hover:text-gray-700={currentPath !== item.path}
							class:hover:border-gray-300={currentPath !== item.path}
						>
							{item.label}
						</a>
					{/each}
				</div>
			</div>
			<div class="flex items-center">
				<button
					onclick={handleLogout}
					class="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
				>
					Logout
				</button>
			</div>
		</div>
	</div>
</nav>

<style>
	nav a {
		text-decoration: none;
	}
</style>
