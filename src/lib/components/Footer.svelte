<script lang="ts">
  import { PrismicLink } from '@prismicio/svelte';

  let { settings } = $props();

  const currentYear = new Date().getFullYear();
</script>

<footer class="w-full px-3 pb-22 md:pb-4 ">
  <div class="md:bg-neutral-900 text-white px-4 pb-3 rounded-full md:flex pt-6 md:pt-3 justify-center mt-[-1px] md:justify-between items-center w-full pt-3 relative">
    <div class="mb-2 md:mb-0 text-sm text-center md:text-left">© {currentYear} ART CAMP EST.2016</div>
    {#if settings?.data?.navigation_footer?.length}
      <ul class="hidden md:flex items-center space-x-6 absolute left-1/2 -translate-x-1/2">
        {#each settings.data.navigation_footer as navItem}
          <li>
            <PrismicLink
              field={navItem}
              class="hover:text-neutral-900 transition-colors duration-300 text-sm text-white"
            >
              {navItem.text || 'Link'}
            </PrismicLink>
          </li>
        {/each}
      </ul>
    {/if}
    <div class=" text-sm text-center md:text-left">Development: <a href="https://www.mariusjopen.com" target="_blank" class="hover:underline decoration-[1px] underline-offset-3">Marius Jopen</a> @ <a href="https://100k.studio/" target="_blank" class="hover:underline decoration-[1px] underline-offset-3">100k Studio</a></div>
  </div>
  
</footer>


