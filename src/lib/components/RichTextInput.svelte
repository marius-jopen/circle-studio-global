<script lang="ts">
	import { toggleBoldInText } from '$lib/utils/boldText';

	let { value = $bindable(''), placeholder = '', rows = 1, class: className = '', id = '' } = $props();
	let inputEl = $state<HTMLTextAreaElement | null>(null);

	function handleBold() {
		const el = inputEl;
		if (!el) return;
		const start = el.selectionStart;
		const end = el.selectionEnd;
		if (start === end) return; // No selection
		value = toggleBoldInText(value, start, end);
		el.focus();
	}
</script>

<div class="flex gap-1 items-stretch {className}">
	<textarea
		bind:this={inputEl}
		bind:value
		{placeholder}
		{rows}
		{id}
		class="flex-1 min-w-0 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors {rows === 1 ? 'resize-none overflow-hidden' : 'resize-y'}"
	></textarea>
	<button
		type="button"
		class="flex-shrink-0 px-2.5 py-1.5 text-sm font-bold border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-100"
		onclick={handleBold}
		title="Bold (select text first)"
		aria-label="Bold"
	>B</button>
</div>
