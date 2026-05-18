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

function isForcedGallery(b: AboutBlock): boolean {
	return b.type === 'gallery' && b.forceFormat === true;
}

function isShapeLocked(b: AboutBlock): boolean {
	if (b.type === 'circle' || b.type === 'collaborators') return true;
	if (b.type === 'gallery' && b.forceFormat) return true;
	return false;
}

function isUniformPattern(pattern: BlockSize[]): boolean {
	return new Set(pattern).size === 1;
}

type SlotShape = 'square' | 'landscape';

function slotShape(pattern: BlockSize[], slotSize: BlockSize): SlotShape {
	if (pattern.length === 1 && pattern[0] === 'full') return 'landscape';
	const minFraction = Math.min(...pattern.map((s) => SIZE_FRACTIONS[s]));
	return SIZE_FRACTIONS[slotSize] === minFraction ? 'square' : 'landscape';
}

function slotCanBePortrait(pattern: BlockSize[], slotSize: BlockSize): boolean {
	const minFraction = Math.min(...pattern.map((s) => SIZE_FRACTIONS[s]));
	return SIZE_FRACTIONS[slotSize] === minFraction && minFraction <= 1 / 3;
}

function pickBlock(
	pool: AboutBlock[],
	slotSize: BlockSize,
	pattern: BlockSize[],
	usedIds: Set<string>
): AboutBlock | null {
	const shape = slotShape(pattern, slotSize);
	const canPortrait = slotCanBePortrait(pattern, slotSize);

	type Scored = { block: AboutBlock; score: number };
	const candidates: Scored[] = [];

	for (const block of pool) {
		if (usedIds.has(block.id)) continue;
		if (!block.allowedSizes.includes(slotSize)) continue;

		let score = 0;
		if (block.pinned) score += 500;
		if (block.type === 'gallery') {
			const pref = block.preferredFormat;
			const matches =
				(pref === 'square' && shape === 'square') ||
				(pref === 'landscape' && shape === 'landscape') ||
				(pref === 'portrait' && canPortrait);

			if (block.forceFormat) {
				score += matches ? 2000 : 200;
			} else if (matches) {
				score += 10;
			} else if (pref !== 'square' && shape === 'square') {
				score -= 1;
			}
		}
		candidates.push({ block, score });
	}

	if (candidates.length === 0) return null;
	candidates.sort((a, b) => b.score - a.score);
	return candidates[0].block;
}

function tryFillPattern(
	pattern: BlockSize[],
	pool: AboutBlock[],
	usedIds: Set<string>
): AboutBlock[] | null {
	const tentativelyUsed = new Set(usedIds);
	const picked: AboutBlock[] = new Array(pattern.length);

	const slotOrder = pattern
		.map((size, idx) => ({ size, idx }))
		.sort((a, b) => SIZE_FRACTIONS[a.size] - SIZE_FRACTIONS[b.size]);

	for (const slot of slotOrder) {
		const block = pickBlock(pool, slot.size, pattern, tentativelyUsed);
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

		let candidatePatterns = patternsForRemaining(remainingCount);

		const hasPortraitRemaining = remaining.some(isPortraitGallery);
		if (hasPortraitRemaining) {
			const smallCellPatterns = candidatePatterns.filter((p) => {
				const min = Math.min(...p.map((s) => SIZE_FRACTIONS[s]));
				return min <= 1 / 3;
			});
			if (smallCellPatterns.length > 0) candidatePatterns = smallCellPatterns;
		}

		const hasShapeLockedRemaining = remaining.some(isShapeLocked);
		if (hasShapeLockedRemaining) {
			let uniformPatterns = candidatePatterns.filter(isUniformPattern);
			const hasSquareOrPortraitForce = remaining.some(
				(b) =>
					b.type === 'gallery' &&
					b.forceFormat &&
					b.preferredFormat !== 'landscape'
			);
			if (hasSquareOrPortraitForce && remainingCount > 1) {
				uniformPatterns = uniformPatterns.filter((p) => p.length > 1);
			}
			if (uniformPatterns.length > 0) candidatePatterns = uniformPatterns;
		}

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

export function cellAspectRatio(
	row: LayoutRow,
	slotIdx: number
): string | null {
	if (row.blocks.some((b) => b.type === 'press')) return null;
	const fractions = row.pattern.map((s) => SIZE_FRACTIONS[s]);
	const minFraction = Math.min(...fractions);
	if (minFraction === 1) return '16 / 9';

	const forcedGallery = row.blocks.find(
		(b) => b.type === 'gallery' && b.forceFormat
	);
	const hasSquareLocked = row.blocks.some(
		(b) => b.type === 'circle' || b.type === 'collaborators'
	);

	let baseFormat: FormatPreference;
	if (forcedGallery && forcedGallery.type === 'gallery') {
		baseFormat = forcedGallery.preferredFormat;
	} else if (hasSquareLocked) {
		baseFormat = 'square';
	} else {
		const smallestBlocks = row.blocks.filter((_, i) => fractions[i] === minFraction);
		const smallestSlotPrefs: FormatPreference[] = smallestBlocks.map((b) =>
			b.type === 'gallery' ? b.preferredFormat : 'square'
		);
		const requested = strongestPreference(smallestSlotPrefs);
		baseFormat = requested === 'portrait' && minFraction > 1 / 3 ? 'square' : requested;
	}

	const baseCellAspect = FORMAT_ASPECT[baseFormat];
	const slotFraction = SIZE_FRACTIONS[row.pattern[slotIdx]];
	const cellAspectValue = (slotFraction / minFraction) * baseCellAspect;
	return `${cellAspectValue} / 1`;
}

export function rowAspectRatio(row: LayoutRow): string | null {
	if (row.blocks.some((b) => b.type === 'press')) return null;
	const fractions = row.pattern.map((s) => SIZE_FRACTIONS[s]);
	const minFraction = Math.min(...fractions);
	if (minFraction === 1) return '16 / 9';

	// Shape-locked blocks (forced gallery > circle/collab) drive the row aspect
	const forcedGallery = row.blocks.find(
		(b) => b.type === 'gallery' && b.forceFormat
	);
	const hasSquareLocked = row.blocks.some(
		(b) => b.type === 'circle' || b.type === 'collaborators'
	);

	let format: FormatPreference;
	if (forcedGallery && forcedGallery.type === 'gallery') {
		format = forcedGallery.preferredFormat;
	} else if (hasSquareLocked) {
		format = 'square';
	} else {
		const smallestBlocks = row.blocks.filter((_, i) => fractions[i] === minFraction);
		const smallestSlotPrefs: FormatPreference[] = smallestBlocks.map((b) =>
			b.type === 'gallery' ? b.preferredFormat : 'square'
		);
		const requested = strongestPreference(smallestSlotPrefs);
		format = requested === 'portrait' && minFraction > 1 / 3 ? 'square' : requested;
	}

	const cellAspect = FORMAT_ASPECT[format];
	return `${cellAspect / minFraction} / 1`;
}

export { SIZE_FRACTIONS };
