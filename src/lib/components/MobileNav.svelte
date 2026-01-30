<script lang="ts">
import { page } from '$app/stores';
import { tick } from 'svelte';
import { homeSearchQuery, mobileSearchOpen } from '$lib/stores';

$: pathname = $page.url.pathname;
$: isHome = pathname === '/';

let searchOpen = false;
let searchInput: HTMLInputElement;
let isClosing = false;
let isOpening = false;
let shouldShrink = false;
let contentVisible = true;

// Sync local searchOpen state with the store
$: if (isHome && $mobileSearchOpen && !searchOpen) {
    isOpening = true;
    contentVisible = false;
    searchOpen = true;
    // Wait for box to expand (300ms), then fade in content
    setTimeout(() => {
        contentVisible = true;
        isOpening = false;
        tick().then(() => {
            searchInput?.focus();
        });
    }, 300);
}
$: if (!$mobileSearchOpen && searchOpen) {
    searchOpen = false;
}
function openSearch() {
    isOpening = true;
    contentVisible = false;
    searchOpen = true;
    mobileSearchOpen.set(true);
    // Wait for box to expand (300ms), then fade in content
    setTimeout(() => {
        contentVisible = true;
        isOpening = false;
        tick().then(() => {
            searchInput?.focus();
        });
    }, 300);
}
function closeSearch() {
    isClosing = true;
    // Start fade out
    contentVisible = false;
    // Wait for fade out to complete (200ms), then shrink the box
    setTimeout(() => {
        // Now shrink the box
        shouldShrink = true;
        // After box shrinks (300ms), remove content from DOM and show icon
        setTimeout(() => {
            searchOpen = false;
            mobileSearchOpen.set(false);
            homeSearchQuery.set('');
            isClosing = false;
            shouldShrink = false;
            contentVisible = true;
        }, 300);
    }, 200);
}
</script>

<!-- Top right search button (only on homepage) -->
{#if isHome}
    <div class="md:hidden fixed top-5 right-4 left-4 z-50">
        <div 
            class="bg-gray-100 rounded-full flex items-center transition-all duration-300 ease-in-out overflow-hidden ml-auto"
            style="height: 48px; width: {searchOpen && !shouldShrink ? '100%' : '48px'}"
        >
            {#if !searchOpen}
                <button 
                    type="button" 
                    class="w-full h-full p-3 flex items-center justify-center flex-shrink-0 transition-opacity duration-200"
                    class:opacity-0={isOpening}
                    class:opacity-100={!isOpening}
                    on:click={openSearch} 
                    aria-label="Search"
                >
                    <img src="/search-logo.svg" alt="Search" class="w-5 h-5" />
                </button>
            {:else}
                <div 
                    class="flex items-center gap-x-2 w-full px-4 py-0 transition-opacity duration-200"
                    class:opacity-0={!contentVisible}
                    class:opacity-100={contentVisible}
                >
                    <input 
                        type="text" 
                        placeholder="Search" 
                        class="p-2 flex-1 bg-transparent outline-none text-xl" 
                        bind:this={searchInput} 
                        bind:value={$homeSearchQuery} 
                    />
                    <button 
                        type="button" 
                        class="text-xl leading-none p-1 flex-shrink-0" 
                        aria-label="Close search" 
                        on:click={closeSearch}
                    >
                        ×
                    </button>
                </div>
            {/if}
        </div>
    </div>
{/if}

<!-- Bottom navigation -->
<div class="md:hidden fixed bottom-5 left-0 right-0 z-50 flex justify-center items-center mx-4">
    <div class="bg-gray-100 rounded-full py-0 px-0">
        <nav class="flex items-center justify-center gap-x-0 text-xl">
            <a href="/" class="text-center font-medium whitespace-nowrap py-2 pl-5 pr-2">Work</a>
            <a href="/about" class="text-center font-medium py-2 pl-2 pr-5">About</a>
            <a href="/play" class="text-center font-medium py-2 pl-0 pr-5">Play</a>
        </nav>
    </div>
</div>