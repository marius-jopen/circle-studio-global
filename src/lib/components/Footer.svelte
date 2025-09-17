<script lang="ts">
  import { PrismicLink } from '@prismicio/svelte';

  let { settings } = $props();

  const currentYear = new Date().getFullYear();
</script>

<footer class="w-full px-3 pb-4">
  <div class="flex justify-center md:justify-between items-center w-full border-t border-gray-200 pt-3">
    <div class="text-sm text-center md:text-left">© {currentYear} Circle Studio</div>
    {#if settings?.data?.navigation_footer?.length}
      <ul class="hidden md:flex items-center space-x-6">
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
  </div>
  
</footer>


