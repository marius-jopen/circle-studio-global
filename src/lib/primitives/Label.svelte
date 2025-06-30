<script lang="ts">
  export let text: string;
  export let htmlFor: string = '';
  export let required: boolean = false;
  export let tooltip: string = '';
  export let variant: 'default' | 'control' | 'section' = 'default';
  export let size: 'sm' | 'md' | 'lg' = 'md';
</script>

<div class="flex justify-between items-center mb-2
  {variant === 'default' ? 'border border-gray-300 rounded-xl p-2 bg-gray-50' : ''}
  {variant === 'control' ? 'p-2' : ''}
  {variant === 'section' ? 'border-b border-gray-300 pb-2 mb-4' : ''}">
  <label for={htmlFor} class="font-medium text-gray-700 cursor-pointer transition-colors duration-200 hover:text-blue-500
    {size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base font-semibold' : 'text-sm'}
    {variant === 'section' ? 'text-lg font-bold text-gray-800' : ''}">
    {text}
    {#if required}<span class="text-red-500 ml-0.5">*</span>{/if}
  </label>
  {#if tooltip}
    <span class="text-xs ml-2 {variant === 'section' ? 'text-gray-600' : 'text-gray-500'}">{tooltip}</span>
  {/if}
  <slot />
</div> 