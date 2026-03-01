/**
 * Ensures essential colors (text, background, black, white) are preserved in the GIF palette
 * so output matches the source exactly (no gray text instead of black).
 */
function hexToRgb(hex: string): [number, number, number] {
	const m = hex.replace(/^#/, '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
	return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
}

function colorEq(a: number[], b: number[]): boolean {
	return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function colorDistance(a: number[], b: number[]): number {
	return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

export function buildGifPalette(
	quantizedPalette: number[][],
	essentialColors?: { textColor?: string; backgroundColor?: string }
): number[][] {
	const palette = [...quantizedPalette];

	// Colors we must include for faithful reproduction (black text, white bg, etc.)
	const mustInclude: number[][] = [
		[0, 0, 0],      // black - critical for text
		[255, 255, 255] // white - critical for backgrounds
	];

	if (essentialColors) {
		if (essentialColors.textColor) mustInclude.push(hexToRgb(essentialColors.textColor));
		if (essentialColors.backgroundColor && essentialColors.backgroundColor !== 'transparent') {
			mustInclude.push(hexToRgb(essentialColors.backgroundColor));
		}
	}

	// Add common UI colors that may appear
	mustInclude.push([243, 244, 246]); // gray-100 input field bg
	mustInclude.push([107, 114, 128]); // gray-500 input text
	mustInclude.push([75, 85, 99]);    // gray-600 cursor

	for (const color of mustInclude) {
		const exists = palette.some(p => colorEq(p, color) || colorDistance(p, color) < 100);
		if (!exists) palette.push(color);
	}

	return palette.slice(0, 256);
}
