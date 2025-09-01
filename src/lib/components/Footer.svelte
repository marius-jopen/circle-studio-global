<script lang="ts">
  import { PrismicLink } from '@prismicio/svelte';

  let { settings } = $props();

  const currentYear = new Date().getFullYear();
</script>

<footer class="w-full px-3 py-4 mt-10">
  <div class="flex justify-between items-center w-full">
    <div class="text-sm">© {currentYear} Circle Studio</div>
    {#if settings?.data?.navigation_footer?.length}
      <ul class="flex items-center space-x-6">
        {#each settings.data.navigation_footer as navItem}
          <li>
            <PrismicLink
              field={navItem}
              class="hover:text-gray-900 transition-colors duration-300 text-sm"
            >
              {navItem.text || 'Link'}
            </PrismicLink>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  
</footer>


