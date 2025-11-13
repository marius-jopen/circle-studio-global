<script lang="ts">
import { page } from '$app/stores';
import { tick } from 'svelte';
import { homeSearchQuery, mobileSearchOpen } from '$lib/stores';

$: pathname = $page.url.pathname;
$: isHome = pathname === '/';
$: isAbout = pathname === '/about' || pathname.startsWith('/about/');
$: isProject = pathname.startsWith('/work/');

let searchOpen = false;
let searchInput: HTMLInputElement;
function openSearch() {
    searchOpen = true;
    mobileSearchOpen.set(true);
    tick().then(() => {
        searchInput?.focus();
    });
}
function closeSearch() {
    searchOpen = false;
    mobileSearchOpen.set(false);
    homeSearchQuery.set('');
}
</script>

<div class="md:hidden fixed bottom-5 left-0 right-0 z-50 flex justify-center items-center">
    <div class={`${isAbout ? 'bg-gray-100' : 'bg-gray-100'} rounded-full py-2 px-5 ${isHome && searchOpen ? 'w-full mx-4' : ''}`}>
        <nav class="flex items-center justify-center gap-x-5 text-xl ${isHome && searchOpen ? 'w-full' : ''}">
            {#if isHome}
                {#if !searchOpen}
                    <button type="button" class="text-center font-medium" on:click={openSearch}>Search</button>
                    <a href="/about" class="text-center font-medium">About</a>
                {:else}
                    <div class="flex items-center gap-x-3 w-full">
                        <input type="text" placeholder="Search" class="flex-1 bg-transparent outline-none text-xl" bind:this={searchInput} bind:value={$homeSearchQuery} />
                        <button type="button" class="text-xl leading-none px-1 mt-[-2px]" aria-label="Close search" on:click={closeSearch}>×</button>
                    </div>
                {/if}
            {:else if isProject}
                <a href="/" class="text-center font-medium whitespace-nowrap">Back</a>
                <a href="/about" class="text-center font-medium">About</a>
            {:else if isAbout}
                <a href="/" class="text-center font-medium whitespace-nowrap">ART CAMP</a>
            {:else}
                <a href="/" class="text-center font-medium whitespace-nowrap">ART CAMP</a>
                <a href="/about" class="text-center font-medium">About</a>
            {/if}
        </nav>
    </div>
</div>