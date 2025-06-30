<script lang="ts">
  export let label: string;
  export let value: number;
  export let min: number = 0;
  export let max: number = 100;
  export let step: number = 1;
  export let unit: string = '';
  export let precision: number = 2;
  export let tooltip: string = '';
  export let disabled: boolean = false;

  $: displayValue = unit ? `${value.toFixed(precision)}${unit}` : value.toFixed(precision);
</script>

<label class="block border border-gray-300 rounded-xl p-2 mb-2 bg-gray-50 transition-all duration-200
  {disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-blue-500 hover:bg-blue-50'}">
  <div class="flex justify-between items-center mb-1">
    <span class="font-medium text-gray-700 text-sm">{label}: {displayValue}</span>
    {#if tooltip}
      <span class="text-xs text-gray-500">{tooltip}</span>
    {/if}
  </div>
  <input 
    type="range" 
    {min} 
    {max} 
    {step} 
    {disabled}
    bind:value 
    on:input
    on:change
    class="w-full h-2 bg-gray-300 rounded-md appearance-none cursor-pointer
      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer
      [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md
      [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:bg-blue-600
      [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500
      [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white
      [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-110
      [&::-moz-range-thumb]:hover:bg-blue-600 [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-md [&::-moz-range-track]:bg-gray-300
      disabled:cursor-not-allowed outline-none"
  />
</label> 