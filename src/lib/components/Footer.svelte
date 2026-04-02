<script lang="ts">
  import { PrismicLink } from '@prismicio/svelte';

  let { settings, isAbout = false } = $props();

  const currentYear = new Date().getFullYear();
</script>

<footer class="w-full px-2 pb-[75px] md:pb-3 ">
  <div class="text-black px-4 rounded pb-8 md:pb-3 flex flex-col md:flex-row pt-6 md:pt-3 justify-center mt-[-1px] md:justify-between items-center w-full pt-3 relative" class:bg-white={isAbout} class:bg-neutral-100={!isAbout}>
    {#if settings?.data?.navigation_footer?.length}
      <ul class="flex items-center space-x-6 mb-6 md:mb-0 md:absolute md:left-1/2 md:-translate-x-1/2">
        {#each settings.data.navigation_footer as navItem}
          <li>
            <PrismicLink
              field={navItem}
              class="hover:text-neutral-900 transition-colors duration-300 text-sm md:text-black"
            >
              {navItem.text || 'Link'}
            </PrismicLink>
          </li>
        {/each}
      </ul>
    {/if}
    <div class="mb-6 md:mb-0 text-sm text-center md:text-left order-first md:order-none">© {currentYear} ART CAMP EST.2016</div>
    <div class=" text-sm text-center md:text-left">Development: <a href="https://www.mariusjopen.com" target="_blank" class="hover:underline decoration-[1px] underline-offset-3">Marius Jopen</a> @ <a href="https://100k.studio/" target="_blank" class="hover:underline decoration-[1px] underline-offset-3">100k Studio</a></div>
  </div>
  
</footer>


