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

<div class="md:hidden fixed bottom-5 left-0 right-0 z-50 flex justify-center items-center mx-4">
    <div class={`bg-gray-100 rounded-full py-0 px-0 ${isHome && searchOpen ? 'w-full mx-0' : ''}`}>
        <nav class="flex items-center justify-center gap-x-0 text-xl ${isHome && searchOpen ? 'w-full' : ''}">
            {#if isHome}
                {#if !searchOpen}
                    <button type="button" class="text-center font-medium py-2 mt-[-1px] pl-5 pr-2 flex items-center justify-center" on:click={openSearch} aria-label="Search">
                        <img src="/search-logo.svg" alt="Search" class="w-5 h-5" />
                    </button>
                    <a href="/" class="text-center font-medium whitespace-nowrap py-2 pl-2 pr-2">Work</a>
                    <a href="/about" class="text-center font-medium py-2 pl-2 pr-5">About</a>
                {:else}
                    <div class="flex items-center gap-x-1 flex-1 px-3">
                        <input type="text" placeholder="Search" class="p-2 flex-1 bg-transparent outline-none text-xl" bind:this={searchInput} bind:value={$homeSearchQuery} />
                        <button type="button" class="text-xl leading-none mt-[-2px] p-2" aria-label="Close search" on:click={closeSearch}>×</button>
                    </div>
                {/if}
            {:else}
                <a href="/" class="text-center font-medium whitespace-nowrap py-2 pl-5 pr-2">Work</a>
                <a href="/about" class="text-center font-medium py-2 pl-2 pr-5">About</a>
            {/if}
        </nav>
    </div>
</div>