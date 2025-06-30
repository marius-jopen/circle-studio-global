<script lang="ts">
  export let title: string;
  export let open: boolean = false;
  export let variant: 'default' | 'controls' | 'bordered' = 'default';
  export let disabled: boolean = false;
  export let icon: string = '▼';
  
  let contentElement: HTMLDivElement;
  
  function toggle() {
    if (!disabled) {
      open = !open;
    }
  }
  
  // Handle keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  }
</script>

<div class="accordion accordion-{variant}" class:open class:disabled>
  <div 
    class="accordion-header"
    on:click={toggle}
    on:keydown={handleKeydown}
    role="button"
    tabindex={disabled ? -1 : 0}
    aria-expanded={open}
    aria-disabled={disabled}
  >
    <h3 class="accordion-title">{title}</h3>
    <span class="accordion-icon" class:rotated={open}>
      {icon}
    </span>
  </div>
  
  <div class="accordion-content" class:open>
    <div class="accordion-body" bind:this={contentElement}>
      <slot />
    </div>
  </div>
</div>

<style>
  .accordion {
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s;
  }

  .accordion-default {
    background: #fafafa;
    border: 1px solid #dbdbdb;
    margin-bottom: 0.5rem;
  }

  .accordion-controls {
    background: #fafafa;
    border: 1px solid #dbdbdb;
    margin-bottom: 1rem;
  }

  .accordion-bordered {
    background: #fff;
    border: 2px solid #e2e8f0;
    margin-bottom: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .accordion.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .accordion:not(.disabled):hover {
    border-color: #4a90e2;
  }

  .accordion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s;
    background: transparent;
  }

  .accordion-header:hover {
    background: rgba(74, 144, 226, 0.05);
  }

  .accordion-header:focus {
    outline: none;
    background: rgba(74, 144, 226, 0.1);
    box-shadow: inset 0 0 0 2px rgba(74, 144, 226, 0.3);
  }

  .accordion.disabled .accordion-header {
    cursor: not-allowed;
  }

  .accordion.disabled .accordion-header:hover {
    background: transparent;
  }

  .accordion-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: bold;
    color: #333;
  }

  .accordion-icon {
    font-size: 1rem;
    transition: transform 0.3s ease;
    color: #666;
  }

  .accordion-icon.rotated {
    transform: rotate(180deg);
  }

  .accordion-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-out;
  }

  .accordion-content.open {
    max-height: 1000px; /* Large enough value to accommodate content */
    transition: max-height 0.3s ease-in;
  }

  .accordion-body {
    padding: 0 1rem 1rem 1rem;
  }

  /* Special styling for controls variant */
  .accordion-controls .accordion-header {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-bottom: 1px solid #dee2e6;
  }

  .accordion-controls.open .accordion-header {
    border-bottom: 1px solid #dbdbdb;
  }

  .accordion-controls .accordion-body {
    background: #fff;
    border-top: 1px solid #e9ecef;
  }

  /* Bordered variant specific styles */
  .accordion-bordered .accordion-header {
    border-bottom: 1px solid #e2e8f0;
  }

  .accordion-bordered.open .accordion-header {
    border-bottom-color: #cbd5e0;
  }

  /* Animation improvements */
  @media (prefers-reduced-motion: reduce) {
    .accordion-content,
    .accordion-icon {
      transition: none;
    }
  }
</style> 