/**
 * Parses text with **bold** markers into an array of { char, bold } for rendering.
 * Use **text** to mark bold segments. Example: "Hello **world**" -> [H,bold:false], [e,bold:false], ...
 */
export function parseBoldText(text: string): { char: string; bold: boolean }[] {
	const result: { char: string; bold: boolean }[] = [];
	let i = 0;
	let isBold = false;
	while (i < text.length) {
		if (text.slice(i, i + 2) === '**') {
			isBold = !isBold;
			i += 2;
			continue;
		}
		// Skip lone asterisks (incomplete or stray markup - never show in animation)
		if (text[i] === '*') {
			i++;
			continue;
		}
		result.push({ char: text[i], bold: isBold });
		i++;
	}
	return result;
}

/** Get plain text without ** markers (for display in places that don't support bold) */
export function stripBoldMarkers(text: string): string {
	return text.replace(/\*\*/g, '');
}

/** Convert text with **bold** to HTML string with <b> tags - never shows asterisks (handles incomplete pairs) */
export function boldTextToHtml(text: string): string {
	let result = '';
	let i = 0;
	let isBold = false;
	while (i < text.length) {
		if (text.slice(i, i + 2) === '**') {
			if (isBold) result += '</b>';
			else result += '<b>';
			isBold = !isBold;
			i += 2;
			continue;
		}
		if (text[i] === '*') {
			i++;
			continue;
		}
		const ch = text[i];
		if (ch === '&') result += '&amp;';
		else if (ch === '<') result += '&lt;';
		else if (ch === '>') result += '&gt;';
		else result += ch;
		i++;
	}
	if (isBold) result += '</b>';
	return result;
}

/** Wrap selected text in ** markers. If selection is already wrapped, unwraps. */
export function toggleBoldInText(text: string, start: number, end: number): string {
	const before = text.slice(0, start);
	const selected = text.slice(start, end);
	const after = text.slice(end);
	// Check if selection is already wrapped in **
	const beforeSel = text.slice(Math.max(0, start - 2), start);
	const afterSel = text.slice(end, end + 2);
	if (beforeSel === '**' && afterSel === '**') {
		// Unwrap
		return text.slice(0, start - 2) + selected + text.slice(end + 2);
	}
	return before + '**' + selected + '**' + after;
}
