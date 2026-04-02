<script lang="ts">
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { tick } from 'svelte';
import { homeSearchQuery, mobileSearchOpen, playInputActive } from '$lib/stores';

$: pathname = $page.url.pathname;
$: isHome = pathname === '/';
$: isPlay = pathname === '/play' || pathname === '/play/preview';
$: isAbout = pathname === '/about' || pathname === '/preview/about';

let atBottom = false;

function checkScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    atBottom = scrollTop + clientHeight >= scrollHeight - 100;
}

import { onMount, onDestroy } from 'svelte';

onMount(() => {
    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
});

onDestroy(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', checkScroll);
    }
});

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
    // Focus immediately to trigger keyboard
    tick().then(() => {
        searchInput?.focus();
    });
    // Wait for box to expand (300ms), then fade in content
    setTimeout(() => {
        contentVisible = true;
        isOpening = false;
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

// Close search when navigating away from home
$: if (!isHome && searchOpen) {
    searchOpen = false;
    mobileSearchOpen.set(false);
    homeSearchQuery.set('');
    isClosing = false;
    shouldShrink = false;
    contentVisible = true;
}
</script>

<!-- Top right search button (only on homepage) -->
{#if isHome}
    <div class="md:hidden fixed top-[6px] right-[14px] left-4 z-50">
        <div 
            class="bg-gray-100 rounded-md flex items-center transition-all duration-300 ease-in-out overflow-hidden ml-auto"
            style="width: {searchOpen && !shouldShrink ? '100%' : '40px'}; height: 40px;"
        >
            {#if !searchOpen}
                <button 
                    type="button" 
                    class="w-10 h-10 flex items-center justify-center flex-shrink-0 transition-opacity duration-200"
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
                        class="mobile-search-input p-2 flex-1 bg-transparent outline-none text-xl"
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

<!-- Bottom navigation (hidden on /play page when input is active) -->
{#if !isPlay || !$playInputActive}
<div class="md:hidden fixed bottom-5 left-0 right-0 z-50 flex justify-center items-center mx-4">
    <div class="rounded-md py-0 px-0 h-12 flex items-center transition-colors" class:bg-white={isAbout && atBottom} class:bg-gray-100={!isAbout || !atBottom}>
        <nav class="flex items-center justify-center gap-x-0 text-xl">
            <a href="/" class="text-center font-medium whitespace-nowrap py-2 pl-5 pr-4 transition-colors duration-300 {isHome ? 'text-neutral-900 underline underline-offset-[5px] decoration-[1.5px]' : 'text-neutral-900'}">Work</a>
            <a href="/about" class="text-center font-medium py-2 pl-4 pr-5 transition-colors duration-300 {isAbout ? 'text-neutral-900 underline underline-offset-[5px] decoration-[1.5px]' : 'text-neutral-900'}">About</a>
            <a href="/play" class="text-center font-medium py-2 pl-4 pr-5 transition-colors duration-300 {isPlay ? 'text-neutral-900 underline underline-offset-[5px] decoration-[1.5px]' : 'text-neutral-900'}" on:click|preventDefault={() => {
                if (isPlay) {
                    playInputActive.set(true);
                } else {
                    try {
                        sessionStorage.setItem('circle-studio-navigating', 'true');
                        sessionStorage.setItem('user-has-interacted', 'true');
                    } catch {}
                    goto('/play');
                }
            }}>Play</a>
        </nav>
    </div>
</div>
{/if}

<style>
	/* Hide placeholder when mobile search input is focused or has value */
	:global(.mobile-search-input:focus::placeholder),
	:global(.mobile-search-input:not(:placeholder-shown)::placeholder) {
		opacity: 0;
		color: transparent;
	}
</style>