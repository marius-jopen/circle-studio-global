<script lang="ts">
  import { PrismicLink } from '@prismicio/svelte';

  let { settings } = $props();

  const currentYear = new Date().getFullYear();
</script>

<footer class="w-full px-3 pb-22 md:pb-4">
  <div class="md:flex pt-6 md:pt-3 justify-center mt-[-1px] md:justify-between items-center w-full border-t border-gray-200 pt-3">
    <div class="mb-2 md:mb-0 text-sm text-center md:text-left">© {currentYear} ART CAMP EST.2016</div>
    {#if settings?.data?.navigation_footer?.length}
      <ul class="hidden md:flex items-center space-x-6 ">
        {#each settings.data.navigation_footer as navItem}
          <li>
            <PrismicLink
              field={navItem}
              class="hover:text-neutral-900 transition-colors duration-300 text-sm"
            >
              {navItem.text || 'Link'}
            </PrismicLink>
          </li>
        {/each}
      </ul>
    {/if}
    <div class=" text-sm text-center md:text-left">Website Development: <a href="https://www.mariusjopen.com" target="_blank" class="hover:underline decoration-[1px] underline-offset-3">Marius Jopen</a></div>
  </div>
  
</footer>


