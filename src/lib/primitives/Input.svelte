<script lang="ts">
  export let type: 'text' | 'number' | 'email' | 'password' | 'color' = 'text';
  export let label: string = '';
  export let value: string | number = '';
  export let placeholder: string = '';
  export let disabled: boolean = false;
  export let required: boolean = false;
  export let min: number | undefined = undefined;
  export let max: number | undefined = undefined;
  export let step: number | undefined = undefined;
  export let tooltip: string = '';
  export let error: string = '';
  export let fullWidth: boolean = true;
</script>

<div class="flex flex-col gap-1 {fullWidth ? 'w-full' : ''}">
  {#if label}
    <div class="flex justify-between items-center">
      <label for="input-{Math.random()}" class="font-medium text-gray-700 text-sm">
        {label}
        {#if required}<span class="text-red-500 ml-0.5">*</span>{/if}
      </label>
      {#if tooltip}
        <span class="text-xs text-gray-500">{tooltip}</span>
      {/if}
    </div>
  {/if}
  
  {#if type === 'text'}
    <input
      id="input-{Math.random()}"
      type="text"
      {placeholder}
      {disabled}
      {required}
      bind:value
      on:input
      on:change
      on:focus
      on:blur
      class="p-2 border border-gray-300 rounded-lg text-base font-inherit transition-all duration-200 bg-white
        focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
        disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
        {error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}"
    />
  {:else if type === 'number'}
    <input
      id="input-{Math.random()}"
      type="number"
      {placeholder}
      {disabled}
      {required}
      {min}
      {max}
      {step}
      bind:value
      on:input
      on:change
      on:focus
      on:blur
      class="p-2 border border-gray-300 rounded-lg text-base font-inherit transition-all duration-200 bg-white
        focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
        disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
        {error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}"
    />
  {:else if type === 'color'}
    <input
      id="input-{Math.random()}"
      type="color"
      {disabled}
      bind:value
      on:input
      on:change
      on:focus
      on:blur
      class="w-12 h-10 p-0.5 border border-gray-300 rounded-lg cursor-pointer transition-all duration-200 bg-white
        focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
        disabled:bg-gray-100 disabled:cursor-not-allowed
        {error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}"
    />
  {:else if type === 'email'}
    <input
      id="input-{Math.random()}"
      type="email"
      {placeholder}
      {disabled}
      {required}
      bind:value
      on:input
      on:change
      on:focus
      on:blur
      class="p-2 border border-gray-300 rounded-lg text-base font-inherit transition-all duration-200 bg-white
        focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
        disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
        {error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}"
    />
  {:else if type === 'password'}
    <input
      id="input-{Math.random()}"
      type="password"
      {placeholder}
      {disabled}
      {required}
      bind:value
      on:input
      on:change
      on:focus
      on:blur
      class="p-2 border border-gray-300 rounded-lg text-base font-inherit transition-all duration-200 bg-white
        focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
        disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
        {error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}"
    />
  {/if}
  
  {#if error}
    <span class="text-xs text-red-500 mt-1">{error}</span>
  {/if}
</div> 