import type { AboutBlock, BlockSize, FormatPreference, LayoutRow } from '$lib/types/aboutBlock';
import { SIZE_FRACTIONS, FORMAT_ASPECT } from '$lib/types/aboutBlock';

const ROW_PATTERNS: BlockSize[][] = [
	['full'],
	['half', 'half'],
	['third', 'third', 'third'],
	['third', 'two_thirds'],
	['two_thirds', 'third'],
	['quarter', 'quarter', 'half'],
	['half', 'quarter', 'quarter'],
	['quarter', 'half', 'quarter']
];

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function patternsForRemaining(remainingCount: number): BlockSize[][] {
	return ROW_PATTERNS.filter((p) => p.length <= remainingCount);
}

function isPortraitGallery(b: AboutBlock): boolean {
	return b.type === 'gallery' && b.preferredFormat === 'portrait';
}

function pickBlock(
	pool: AboutBlock[],
	slotSize: BlockSize,
	usedIds: Set<string>,
	preferPortrait: boolean
): AboutBlock | null {
	let nonPortraitMatch: AboutBlock | null = null;
	let portraitMatch: AboutBlock | null = null;

	for (const block of pool) {
		if (usedIds.has(block.id)) continue;
		if (!block.allowedSizes.includes(slotSize)) continue;
		if (isPortraitGallery(block)) {
			if (!portraitMatch) portraitMatch = block;
		} else {
			if (!nonPortraitMatch) nonPortraitMatch = block;
		}
	}

	if (preferPortrait) {
		return portraitMatch ?? nonPortraitMatch;
	}
	return nonPortraitMatch ?? portraitMatch;
}

function tryFillPattern(
	pattern: BlockSize[],
	pool: AboutBlock[],
	usedIds: Set<string>
): AboutBlock[] | null {
	const tentativelyUsed = new Set(usedIds);
	const picked: AboutBlock[] = new Array(pattern.length);
	const minFraction = Math.min(...pattern.map((s) => SIZE_FRACTIONS[s]));

	const slotOrder = pattern
		.map((size, idx) => ({ size, idx }))
		.sort((a, b) => SIZE_FRACTIONS[a.size] - SIZE_FRACTIONS[b.size]);

	for (const slot of slotOrder) {
		const isSmallest = SIZE_FRACTIONS[slot.size] === minFraction;
		const block = pickBlock(pool, slot.size, tentativelyUsed, isSmallest);
		if (!block) return null;
		picked[slot.idx] = block;
		tentativelyUsed.add(block.id);
	}

	return picked;
}

function rowSignature(pattern: BlockSize[]): string {
	return pattern.join('+');
}

export function buildAboutLayout(blocks: AboutBlock[]): LayoutRow[] {
	if (blocks.length === 0) return [];

	const pinned = blocks.filter((b) => b.pinned);
	const unpinned = shuffle(blocks.filter((b) => !b.pinned));

	const pool = [...unpinned];
	for (const p of shuffle(pinned)) {
		const insertAt = Math.floor(Math.random() * (pool.length + 1));
		pool.splice(insertAt, 0, p);
	}

	const rows: LayoutRow[] = [];
	const usedIds = new Set<string>();
	let lastSignature: string | null = null;

	while (usedIds.size < pool.length) {
		const remaining = pool.filter((b) => !usedIds.has(b.id));
		const remainingCount = remaining.length;

		const candidatePatterns = patternsForRemaining(remainingCount);
		const variantPatterns = candidatePatterns.filter(
			(p) => rowSignature(p) !== lastSignature
		);
		const orderedPatterns = shuffle(variantPatterns.length > 0 ? variantPatterns : candidatePatterns);

		let chosenRow: AboutBlock[] | null = null;
		let chosenPattern: BlockSize[] | null = null;

		for (const pattern of orderedPatterns) {
			const wouldRemain = remainingCount - pattern.length;
			if (wouldRemain === 1 && remainingCount > pattern.length) continue;
			const filled = tryFillPattern(pattern, remaining, usedIds);
			if (filled) {
				chosenRow = filled;
				chosenPattern = pattern;
				break;
			}
		}

		if (!chosenRow) {
			for (const pattern of shuffle(candidatePatterns)) {
				const filled = tryFillPattern(pattern, remaining, usedIds);
				if (filled) {
					chosenRow = filled;
					chosenPattern = pattern;
					break;
				}
			}
		}

		if (!chosenRow || !chosenPattern) {
			const fallback = remaining[0];
			rows.push({ blocks: [fallback], pattern: ['full'] });
			usedIds.add(fallback.id);
			lastSignature = rowSignature(['full']);
			continue;
		}

		rows.push({ blocks: chosenRow, pattern: chosenPattern });
		for (const b of chosenRow) usedIds.add(b.id);
		lastSignature = rowSignature(chosenPattern);
	}

	return rows;
}

const COL_SPAN: Record<BlockSize, string> = {
	full: 'md:col-span-12',
	two_thirds: 'md:col-span-8',
	half: 'md:col-span-6',
	third: 'md:col-span-4',
	quarter: 'md:col-span-3'
};

export function gridColsClassFor(_pattern: BlockSize[]): string {
	return 'grid-cols-1 md:grid-cols-12';
}

export function colSpanClassFor(size: BlockSize, _pattern: BlockSize[]): string {
	return COL_SPAN[size];
}

function strongestPreference(prefs: FormatPreference[]): FormatPreference {
	if (prefs.includes('portrait')) return 'portrait';
	if (prefs.includes('landscape')) return 'landscape';
	return 'square';
}

export function rowAspectRatio(row: LayoutRow): string | null {
	if (row.blocks.some((b) => b.type === 'press')) return null;
	const fractions = row.pattern.map((s) => SIZE_FRACTIONS[s]);
	const minFraction = Math.min(...fractions);
	if (minFraction === 1) return '16 / 9';

	const smallestSlotPrefs: FormatPreference[] = row.blocks
		.map((b, i) => ({ b, i }))
		.filter(({ i }) => fractions[i] === minFraction)
		.map(({ b }) => (b.type === 'gallery' ? b.preferredFormat : 'square'));

	const format = strongestPreference(smallestSlotPrefs);
	const cellAspect = FORMAT_ASPECT[format];
	return `${cellAspect / minFraction} / 1`;
}

export { SIZE_FRACTIONS };
