<script lang="ts">
  export let label: string = '';
  export let value: any = '';
  export let options: { value: any; label: string; disabled?: boolean }[] = [];
  export let disabled: boolean = false;
  export let placeholder: string = 'Select an option...';
  export let tooltip: string = '';
  export let error: string = '';
  export let required: boolean = false;
</script>

<div class="flex flex-col gap-1 w-full">
  {#if label}
    <div class="flex justify-between items-center">
      <label for="select-{Math.random()}" class="font-medium text-neutral-700 text-sm">
        {label}
        {#if required}<span class="text-red-500 ml-0.5">*</span>{/if}
      </label>
      {#if tooltip}
        <span class="text-xs text-neutral-500">{tooltip}</span>
      {/if}
    </div>
  {/if}
  
  <div class="relative inline-block w-full">
    <select
      id="select-{Math.random()}"
      bind:value
      {disabled}
      {required}
      on:change
      on:focus
      on:blur
      class="appearance-none w-full pr-8 pl-2 py-2 border border-gray-300 rounded text-base font-inherit bg-white cursor-pointer transition-all duration-200
        focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
        disabled:bg-gray-100 disabled:text-neutral-500 disabled:cursor-not-allowed
        [&::-moz-focus-inner]:border-0
        {error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}"
    >
      {#if placeholder}
        <option value="" disabled>{placeholder}</option>
      {/if}
      {#each options as option}
        <option value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      {/each}
    </select>
    <div class="absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none text-neutral-600 transition-transform duration-200">
      <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
  
  {#if error}
    <span class="text-xs text-red-500 mt-1">{error}</span>
  {/if}
</div> 