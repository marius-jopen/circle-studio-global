<script lang="ts">
import { page } from '$app/stores';
import { tick } from 'svelte';

$: pathname = $page.url.pathname;
$: isHome = pathname === '/';
$: isAbout = pathname === '/about' || pathname.startsWith('/about/');
$: isProject = pathname.startsWith('/work/');

let searchOpen = false;
let searchInput: HTMLInputElement;
function openSearch() {
    searchOpen = true;
    tick().then(() => {
        searchInput?.focus();
    });
}
</script>

<div class="fixed bottom-5 left-0 right-0 z-50 flex justify-center items-center">
    <div class={`${isAbout ? 'bg-gray-100' : 'bg-white'} rounded-full py-2 px-4 ${isHome && searchOpen ? 'w-full mx-4' : ''}`}>
        <nav class="flex items-center justify-center gap-x-4 text-xl ${isHome && searchOpen ? 'w-full' : ''}">
            {#if isHome}
                {#if !searchOpen}
                    <button type="button" class="text-center font-medium" on:click={openSearch}>Search</button>
                    <a href="/about" class="text-center font-medium">About</a>
                {:else}
                    <input type="text" placeholder="Search" class="w-full bg-transparent outline-none text-xl" bind:this={searchInput} />
                {/if}
            {:else if isProject}
                <a href="/" class="text-center font-medium whitespace-nowrap">Art Camp Global</a>
                <a href="/about" class="text-center font-medium">About</a>
            {:else if isAbout}
                <a href="/" class="text-center font-medium whitespace-nowrap">Art Camp Global</a>
            {:else}
                <a href="/" class="text-center font-medium whitespace-nowrap">Art Camp Global</a>
                <a href="/about" class="text-center font-medium">About</a>
            {/if}
        </nav>
    </div>
</div>