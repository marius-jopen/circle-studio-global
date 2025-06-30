<script lang="ts">
  export let checked: boolean = false;
  export let label: string = '';
  export let disabled: boolean = false;
  export let tooltip: string = '';
  export let size: 'sm' | 'md' | 'lg' = 'md';
</script>

<label class="flex items-center cursor-pointer select-none gap-2 transition-all duration-200
  {disabled ? 'opacity-60 cursor-not-allowed' : ''}">
  <input 
    type="checkbox" 
    bind:checked 
    {disabled}
    on:change
    class="sr-only"
  />
  <span class="relative bg-white border-2 border-gray-300 rounded transition-all duration-200 flex items-center justify-center
    {size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}
    {checked ? 'bg-blue-500 border-blue-500' : 'hover:border-blue-500 hover:bg-blue-50'}
    focus-within:ring-2 focus-within:ring-blue-100">
    {#if checked}
      <svg class="text-white {size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'}" 
           viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
      </svg>
    {/if}
  </span>
  {#if label}
    <span class="font-medium text-gray-700 text-sm">{label}</span>
  {/if}
  {#if tooltip}
    <span class="text-xs text-gray-500 ml-auto">{tooltip}</span>
  {/if}
</label> 