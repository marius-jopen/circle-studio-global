<script lang="ts">
  export let isRecording: boolean = false;
  export let elapsedTime: number = 0;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  
  // Format time as MM:SS
  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
</script>

{#if isRecording}
  <div class="flex items-center gap-2">
    <div class="rounded-full bg-red-500 animate-pulse
      {size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'}"></div>
    <span class="font-mono font-bold text-neutral-700
      {size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-lg'}">{formatTime(elapsedTime)}</span>
  </div>
{/if} 