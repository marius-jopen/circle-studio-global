<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'danger' | 'fade' | 'record' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled: boolean = false;
  export let recording: boolean = false;
  export let rounded: boolean = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
</script>

<button 
  class="inline-flex items-center justify-center gap-2 font-bold border-0 cursor-pointer transition-all duration-200 font-inherit no-underline
    {size === 'sm' ? 'px-2 py-1 text-sm' : size === 'lg' ? 'px-6 py-3 text-lg' : 'px-4 py-2 text-base'}
    {rounded ? 'rounded-full aspect-square p-2' : 'rounded-full'}
    {variant === 'primary' ? 'bg-gray-400 text-white hover:bg-gray-600' : ''}
    {variant === 'secondary' ? 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200' : ''}
    {variant === 'danger' ? 'bg-red-400 text-white hover:bg-red-600' : ''}
    {variant === 'fade' ? 'bg-blue-400 text-white hover:bg-blue-600' : ''}
    {variant === 'record' ? (recording ? 'bg-blue-600 animate-pulse' : 'bg-red-400 hover:bg-red-600') + ' text-white' : ''}
    {disabled ? 'opacity-60 cursor-not-allowed' : ''}"
  {disabled}
  {type}
  on:click
>
  <slot />
</button> 