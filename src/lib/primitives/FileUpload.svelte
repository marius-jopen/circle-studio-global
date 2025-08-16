<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let accept: string = 'image/*,video/*';
  export let multiple: boolean = false;
  export let disabled: boolean = false;
  export let maxSize: number = 100; // MB
  export let label: string = 'Upload Media';
  export let description: string = 'Drag and drop an image or video file, or click to browse';
  export let currentFile: { name: string; type: string; url: string } | null = null;
  
  const dispatch = createEventDispatcher<{
    upload: { file: File; url: string; type: 'image' | 'video' };
    remove: void;
    error: { message: string };
  }>();
  
  let isDragOver = false;
  let fileInput: HTMLInputElement;
  
  function handleDragOver(event: DragEvent) {
    if (disabled) return;
    event.preventDefault();
    isDragOver = true;
  }
  
  function handleDragLeave(event: DragEvent) {
    if (disabled) return;
    event.preventDefault();
    isDragOver = false;
  }
  
  function handleDrop(event: DragEvent) {
    if (disabled) return;
    event.preventDefault();
    isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      if (multiple) {
        Array.from(files).forEach(file => processFile(file));
      } else {
        processFile(files[0]);
      }
    }
  }
  
  function handleFileInput(event: Event) {
    if (disabled) return;
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      if (multiple) {
        Array.from(files).forEach(file => processFile(file));
      } else {
        processFile(files[0]);
      }
    }
  }
  
  function processFile(file: File) {
    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      dispatch('error', { message: 'Please select an image or video file.' });
      return;
    }
    
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      dispatch('error', { message: `File size must be less than ${maxSize}MB.` });
      return;
    }
    
    // Create object URL
    const url = URL.createObjectURL(file);
    const type = isImage ? 'image' : 'video';
    
    dispatch('upload', { file, url, type });
  }
  
  function handleClick() {
    if (disabled) return;
    fileInput.click();
  }
  
  function handleRemove() {
    dispatch('remove');
  }
</script>

<div class="file-upload">
  <input
    bind:this={fileInput}
    type="file"
    {accept}
    {multiple}
    {disabled}
    on:change={handleFileInput}
    class="hidden"
  />
  
  {#if currentFile}
    <div class="current-file">
      <div class="file-info">
        <div class="flex items-center gap-3">
          <div class="file-icon">
            {#if currentFile.type.startsWith('image/')}
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            {:else}
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            {/if}
          </div>
          <div class="file-details">
            <p class="file-name">{currentFile.name}</p>
            <p class="file-type">{currentFile.type}</p>
          </div>
        </div>
        <button
          type="button"
          on:click={handleRemove}
          class="remove-btn"
          {disabled}
          aria-label="Remove file"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      {#if currentFile.type.startsWith('image/')}
        <div class="preview">
          <img src={currentFile.url} alt="Preview" class="preview-image" />
        </div>
      {:else}
        <div class="preview">
          <video src={currentFile.url} class="preview-video" muted controls>
            <track kind="captions" />
          </video>
        </div>
      {/if}
    </div>
  {:else}
    <div
      class="drop-zone"
      class:drag-over={isDragOver}
      class:disabled
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
      on:drop={handleDrop}
      on:click={handleClick}
      on:keydown={(e) => e.key === 'Enter' && handleClick()}
      role="button"
      tabindex="0"
    >
    
      <div class="drop-zone-content">
        <div class="upload-icon">
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
        </div>
        <h3 class="upload-label">{label}</h3>
        <p class="upload-description">{description}</p>
        <p class="upload-formats">Supports: Images (JPG, PNG, GIF, WebP) and Videos (MP4, WebM, MOV)</p>
        <p class="upload-size">Max file size: {maxSize}MB</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .file-upload {
    width: 100%;
  }
  
  .hidden {
    display: none;
  }
  
  .current-file {
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    padding: 16px;
    background: #f9fafb;
  }
  
  .file-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .file-icon {
    color: #6b7280;
  }
  
  .file-details {
    flex: 1;
    margin-left: 12px;
  }
  
  .file-name {
    font-weight: 600;
    color: #374151;
    margin: 0;
    font-size: 14px;
  }
  
  .file-type {
    color: #6b7280;
    margin: 0;
    font-size: 12px;
  }
  
  .remove-btn {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .remove-btn:hover:not(:disabled) {
    background: #dc2626;
    transform: scale(1.05);
  }
  
  .remove-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .preview {
    border-radius: 12px;
    overflow: hidden;
    background: #ffffff;
    border: 1px solid #e5e7eb;
  }
  
  .preview-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
  }
  
  .preview-video {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
  }
  
  .drop-zone {
    border: 2px dashed #d1d5db;
    border-radius: 16px;
    padding: 32px 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #f9fafb;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .drop-zone:hover:not(.disabled) {
    border-color: #3b82f6;
    background: #eff6ff;
    transform: translateY(-2px);
  }
  
  .drop-zone.drag-over {
    border-color: #3b82f6;
    background: #dbeafe;
    transform: scale(1.02);
  }
  
  .drop-zone.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f3f4f6;
  }
  
  .drop-zone-content {
    max-width: 300px;
  }
  
  .upload-icon {
    color: #9ca3af;
    margin-bottom: 16px;
    display: flex;
    justify-content: center;
  }
  
  .upload-label {
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
  }
  
  .upload-description {
    color: #6b7280;
    margin: 0 0 12px 0;
    font-size: 14px;
  }
  
  .upload-formats {
    color: #9ca3af;
    margin: 0 0 4px 0;
    font-size: 12px;
  }
  
  .upload-size {
    color: #9ca3af;
    margin: 0;
    font-size: 12px;
  }
</style> 