<script lang="ts">
import { page } from '$app/stores';
import { tick } from 'svelte';
import { goto } from '$app/navigation';
import { homeSearchQuery, mobileSearchOpen } from '$lib/stores';
import { scale } from 'svelte/transition';

$: pathname = $page.url.pathname;
$: isHome = pathname === '/';
$: isAbout = pathname === '/about' || pathname.startsWith('/about/');
$: isProject = pathname.startsWith('/work/');

let searchOpen = false;
let searchInput: HTMLInputElement;

// Sync local searchOpen state with the store
$: if (isHome && $mobileSearchOpen && !searchOpen) {
    searchOpen = true;
    tick().then(() => {
        searchInput?.focus();
    });
}
$: if (!$mobileSearchOpen && searchOpen) {
    searchOpen = false;
}
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
function openSearchAndNavigate() {
    // Navigate to home and open search
    mobileSearchOpen.set(true);
    goto('/').then(() => {
        tick().then(() => {
            searchOpen = true;
            searchInput?.focus();
        });
    });
}
</script>

<!-- Top right search button (only on homepage) -->
{#if isHome}
    <div class="md:hidden fixed top-5 right-4 z-50">
        {#if !searchOpen}
            <button 
                type="button" 
                class="bg-gray-100 rounded-full p-3 flex items-center justify-center " 
                on:click={openSearch} 
                aria-label="Search"
            >
                <img src="/search-logo.svg" alt="Search" class="w-5 h-5" />
            </button>
        {:else}
            <div 
                class="bg-gray-100 rounded-full px-4 py-0 flex items-center gap-x-2  transition-all duration-200"
                transition:scale={{ start: 0.8, duration: 200 }}
                style="transform-origin: right center;"
            >
                <input 
                    type="text" 
                    placeholder="Search" 
                    class="p-2 flex-1 bg-transparent outline-none text-xl min-w-[200px]" 
                    bind:this={searchInput} 
                    bind:value={$homeSearchQuery} 
                />
                <button 
                    type="button" 
                    class="text-xl leading-none p-1" 
                    aria-label="Close search" 
                    on:click={closeSearch}
                >
                    ×
                </button>
            </div>
        {/if}
    </div>
{/if}

<!-- Bottom navigation -->
<div class="md:hidden fixed bottom-5 left-0 right-0 z-50 flex justify-center items-center mx-4">
    <div class="bg-gray-100 rounded-full py-0 px-0">
        <nav class="flex items-center justify-center gap-x-0 text-xl">
            {#if isHome}
                <a href="/" class="text-center font-medium whitespace-nowrap py-2 pl-5 pr-2">Work</a>
                <a href="/about" class="text-center font-medium py-2 pl-2 pr-5">About</a>
            {:else if isAbout}
                <button type="button" class="text-center font-medium py-2 mt-[-1px] pl-5 pr-2 flex items-center justify-center" on:click={openSearchAndNavigate} aria-label="Search">
                    <img src="/search-logo.svg" alt="Search" class="w-5 h-5" />
                </button>
                <a href="/" class="text-center font-medium whitespace-nowrap py-2 pl-2 pr-2">Work</a>
                <a href="/about" class="text-center font-medium py-2 pl-2 pr-5">About</a>
            {:else}
                <a href="/" class="text-center font-medium whitespace-nowrap py-2 pl-5 pr-2">Work</a>
                <a href="/about" class="text-center font-medium py-2 pl-2 pr-5">About</a>
            {/if}
        </nav>
    </div>
</div>