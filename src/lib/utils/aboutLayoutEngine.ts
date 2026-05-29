import type {
	AboutBlock,
	BlockSize,
	BlockType,
	FormatPreference,
	LayoutRow
} from '$lib/types/aboutBlock';
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

// The "clock" is a circle whose text uses the [date] shortcode. It must not sit next to
// another circle, so poetry phrases are never placed beside the clock.
function isClock(b: AboutBlock): boolean {
	return b.type === 'circle' && b.items.some((t) => /\[date\]/i.test(t));
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
	usedIds: Set<string>,
	excludeTypes?: Set<BlockType>,
	disallowClock = false
): AboutBlock | null {
	const shape = slotShape(pattern, slotSize);
	const canPortrait = slotCanBePortrait(pattern, slotSize);

	type Scored = { block: AboutBlock; score: number };
	const candidates: Scored[] = [];

	for (const block of pool) {
		if (usedIds.has(block.id)) continue;
		if (excludeTypes?.has(block.type)) continue;
		if (disallowClock && isClock(block)) continue;
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
	const topScore = candidates[0].score;
	const topCandidates = candidates.filter((c) => c.score === topScore);
	return topCandidates[Math.floor(Math.random() * topCandidates.length)].block;
}

function tryFillPattern(
	pattern: BlockSize[],
	pool: AboutBlock[],
	usedIds: Set<string>
): AboutBlock[] | null {
	const tentativelyUsed = new Set(usedIds);
	const picked: AboutBlock[] = new Array(pattern.length);
	const usedTypesInRow = new Set<BlockType>();
	let rowHasCircle = false;
	let rowHasClock = false;

	const slotOrder = shuffle(pattern.map((size, idx) => ({ size, idx }))).sort(
		(a, b) => SIZE_FRACTIONS[a.size] - SIZE_FRACTIONS[b.size]
	);

	for (const slot of slotOrder) {
		// Hard constraints: the clock and any other circle must never share a row.
		const hardExclude = new Set<BlockType>();
		if (rowHasClock) hardExclude.add('circle');
		const disallowClock = rowHasCircle;

		// Soft constraint: keep the two collaborators wheels out of the same row when possible.
		const softExclude = new Set<BlockType>(hardExclude);
		if (usedTypesInRow.has('collaborators')) softExclude.add('collaborators');

		let block = pickBlock(pool, slot.size, pattern, tentativelyUsed, softExclude, disallowClock);
		// Drop only the soft (collaborators) constraint as a fallback. The clock rule stays strict;
		// if that means the row can't be filled, return null so the caller tries another pattern.
		if (!block && softExclude.size > hardExclude.size) {
			const exclude = hardExclude.size > 0 ? hardExclude : undefined;
			block = pickBlock(pool, slot.size, pattern, tentativelyUsed, exclude, disallowClock);
		}
		if (!block) return null;
		picked[slot.idx] = block;
		tentativelyUsed.add(block.id);
		usedTypesInRow.add(block.type);
		if (block.type === 'circle') {
			rowHasCircle = true;
			if (isClock(block)) rowHasClock = true;
		}
	}

	return picked;
}

function rowSignature(pattern: BlockSize[]): string {
	return pattern.join('+');
}

// Builds rows from an already-ordered pool using constraint-aware, scored per-slot picking. The
// pool order seeds variety; this is the engine used for the freely-shuffled middle zone.
function buildRowsFromPool(pool: AboutBlock[]): LayoutRow[] {
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

		const hasCollabRemaining = remaining.some((b) => b.type === 'collaborators');
		if (hasCollabRemaining) {
			const collabPatterns = candidatePatterns.filter(
				(p) => p.length === 2 && p.every((s) => s === 'half')
			);
			if (collabPatterns.length > 0) candidatePatterns = collabPatterns;
		}

		const hasForcedRemaining = remaining.some(isForcedGallery);
		if (hasForcedRemaining) {
			let uniformPatterns = candidatePatterns.filter(isUniformPattern);
			const hasSquareOrPortraitForce = remaining.some(
				(b) => b.type === 'gallery' && b.forceFormat && b.preferredFormat !== 'landscape'
			);
			if (hasSquareOrPortraitForce && remainingCount > 1) {
				uniformPatterns = uniformPatterns.filter((p) => p.length > 1);
			}
			if (uniformPatterns.length > 0) candidatePatterns = uniformPatterns;
		}

		const variantPatterns = candidatePatterns.filter((p) => rowSignature(p) !== lastSignature);
		const orderedPatterns = shuffle(
			variantPatterns.length > 0 ? variantPatterns : candidatePatterns
		);

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

// Picks the row patterns a zone block can lead. Excludes the lone full-width banner for
// circle/gallery (so a pinned block shares its row instead of spanning the whole width), keeps
// collaborators in a half|half row, and best-effort honors portrait/forced gallery shape needs.
function zoneCandidatePatterns(next: AboutBlock, available: number): BlockSize[][] {
	if (next.type === 'press') return [['full']];
	if (next.type === 'collaborators') {
		return ROW_PATTERNS.filter(
			(p) => p.length <= available && p.length === 2 && p.every((s) => s === 'half')
		);
	}

	let patterns = ROW_PATTERNS.filter(
		(p) => p.length > 1 && p.length <= available && next.allowedSizes.includes(p[0])
	);

	if (next.type === 'gallery') {
		if (next.preferredFormat === 'portrait') {
			const small = patterns.filter((p) => SIZE_FRACTIONS[p[0]] <= 1 / 3);
			if (small.length > 0) patterns = small;
		}
		if (next.forceFormat) {
			const uniform = patterns.filter(isUniformPattern);
			if (uniform.length > 0) patterns = uniform;
		}
	}

	return patterns;
}

// Fills one zone (top/bottom) row: zone blocks occupy the leftmost slots in strict order, and any
// remaining slots are filled with `fillers` (middle-pool blocks) — the boundary-sharing case.
// Returns null if the pattern can't be filled this way. Hard constraint: a clock circle never
// shares a row with another circle.
function fillPatternInOrder(
	pattern: BlockSize[],
	zoneRemaining: AboutBlock[],
	fillers: AboutBlock[]
): { blocks: AboutBlock[]; zoneUsed: number; fillersUsed: AboutBlock[] } | null {
	const blocks: AboutBlock[] = new Array(pattern.length);
	let zoneIdx = 0;
	let switchedToFillers = false;
	const usedFillers = new Set<AboutBlock>();
	const fillersUsed: AboutBlock[] = [];
	let rowHasCircle = false;
	let rowHasClock = false;

	const fits = (b: AboutBlock, size: BlockSize): boolean => {
		if (!b.allowedSizes.includes(size)) return false;
		if (rowHasClock && b.type === 'circle') return false;
		if (rowHasCircle && isClock(b)) return false;
		return true;
	};
	const register = (b: AboutBlock) => {
		if (b.type === 'circle') {
			rowHasCircle = true;
			if (isClock(b)) rowHasClock = true;
		}
	};

	for (let slot = 0; slot < pattern.length; slot++) {
		const size = pattern[slot];
		if (
			!switchedToFillers &&
			zoneIdx < zoneRemaining.length &&
			fits(zoneRemaining[zoneIdx], size)
		) {
			const b = zoneRemaining[zoneIdx];
			blocks[slot] = b;
			register(b);
			zoneIdx++;
			continue;
		}
		// A zone block remains but didn't fit this slot — stop placing zone blocks so they stay a
		// contiguous, left-aligned, in-order prefix; the rest of the row becomes fillers.
		if (!switchedToFillers && zoneIdx < zoneRemaining.length) switchedToFillers = true;

		let filler: AboutBlock | null = null;
		for (const f of fillers) {
			if (usedFillers.has(f)) continue;
			if (!fits(f, size)) continue;
			filler = f;
			break;
		}
		if (!filler) return null;
		blocks[slot] = filler;
		usedFillers.add(filler);
		fillersUsed.push(filler);
		register(filler);
	}

	if (zoneIdx === 0) return null;
	return { blocks, zoneUsed: zoneIdx, fillersUsed };
}

// Packs a top/bottom zone: consumes zoneBlocks in CMS order into rows, pulling fillers from the
// middle pool to complete partial rows. Mutates middlePool to remove pulled blocks. `pullFrom`
// chooses which end of the middle pool fillers come from (front for top, back for bottom).
function packZoneInOrder(
	zoneBlocks: AboutBlock[],
	middlePool: AboutBlock[],
	pullFrom: 'front' | 'back'
): LayoutRow[] {
	if (zoneBlocks.length === 0) return [];

	const rows: LayoutRow[] = [];
	let i = 0;
	let lastSignature: string | null = null;

	while (i < zoneBlocks.length) {
		const zoneRemaining = zoneBlocks.slice(i);
		const next = zoneRemaining[0];
		const fillers = pullFrom === 'front' ? middlePool : [...middlePool].reverse();

		const available = zoneRemaining.length + fillers.length;
		const candidates = zoneCandidatePatterns(next, available);
		const variant = candidates.filter((p) => rowSignature(p) !== lastSignature);
		const ordered = shuffle(variant.length > 0 ? variant : candidates);

		let result: { blocks: AboutBlock[]; zoneUsed: number; fillersUsed: AboutBlock[] } | null = null;
		let chosenPattern: BlockSize[] | null = null;
		for (const pattern of ordered) {
			const filled = fillPatternInOrder(pattern, zoneRemaining, fillers);
			if (filled) {
				result = filled;
				chosenPattern = pattern;
				break;
			}
		}

		if (!result || !chosenPattern) {
			// Nothing fit (e.g. no compatible fillers left) — drop the block into its own full row.
			rows.push({ blocks: [next], pattern: ['full'] });
			i += 1;
			lastSignature = rowSignature(['full']);
			continue;
		}

		rows.push({ blocks: result.blocks, pattern: chosenPattern });
		for (const f of result.fillersUsed) {
			const idx = middlePool.indexOf(f);
			if (idx >= 0) middlePool.splice(idx, 1);
		}
		i += result.zoneUsed;
		lastSignature = rowSignature(chosenPattern);
	}

	return rows;
}

export function buildAboutLayout(blocks: AboutBlock[]): LayoutRow[] {
	if (blocks.length === 0) return [];

	const topBlocks = blocks.filter((b) => b.position === 'top');
	const bottomBlocks = blocks.filter((b) => b.position === 'bottom');
	const middleBlocks = blocks.filter((b) => b.position !== 'top' && b.position !== 'bottom');

	// Middle pool: the existing shuffle + pinned random-insert behaviour, scoped to middle blocks.
	const pinned = middleBlocks.filter((b) => b.pinned);
	const unpinned = shuffle(middleBlocks.filter((b) => !b.pinned));
	const middlePool = [...unpinned];
	for (const p of shuffle(pinned)) {
		const insertAt = Math.floor(Math.random() * (middlePool.length + 1));
		middlePool.splice(insertAt, 0, p);
	}

	// Top/bottom consume their blocks in CMS order and may pull middle blocks to complete a row.
	// These run before the middle build and remove pulled blocks from middlePool (no duplicates).
	const topRows = packZoneInOrder(topBlocks, middlePool, 'front');
	const bottomRows = packZoneInOrder(bottomBlocks, middlePool, 'back');

	// Only the middle rows get reshuffled; top/bottom keep their order so the zones stay anchored.
	const middleRows = shuffleRowsAvoidingAdjacentDupes(buildRowsFromPool(middlePool));

	return [...topRows, ...middleRows, ...bottomRows];
}

function shuffleRowsAvoidingAdjacentDupes(rows: LayoutRow[]): LayoutRow[] {
	if (rows.length <= 1) return rows;
	let attempt = shuffle(rows);
	for (let tries = 0; tries < 10; tries++) {
		let hasDup = false;
		for (let i = 1; i < attempt.length; i++) {
			if (rowSignature(attempt[i].pattern) === rowSignature(attempt[i - 1].pattern)) {
				hasDup = true;
				break;
			}
		}
		if (!hasDup) return attempt;
		attempt = shuffle(rows);
	}
	return attempt;
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

export function cellAspectRatio(row: LayoutRow, slotIdx: number): string | null {
	if (row.blocks.some((b) => b.type === 'press')) return null;
	const fractions = row.pattern.map((s) => SIZE_FRACTIONS[s]);
	const minFraction = Math.min(...fractions);
	if (minFraction === 1) return '16 / 9';

	const forcedGallery = row.blocks.find((b) => b.type === 'gallery' && b.forceFormat);
	const hasSquareLocked = row.blocks.some((b) => b.type === 'circle' || b.type === 'collaborators');

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

export function rowFormat(row: LayoutRow): FormatPreference | null {
	if (row.blocks.some((b) => b.type === 'press')) return null;
	const fractions = row.pattern.map((s) => SIZE_FRACTIONS[s]);
	const minFraction = Math.min(...fractions);

	const forcedGallery = row.blocks.find((b) => b.type === 'gallery' && b.forceFormat);
	const hasSquareLocked = row.blocks.some((b) => b.type === 'circle' || b.type === 'collaborators');

	if (forcedGallery && forcedGallery.type === 'gallery') {
		return forcedGallery.preferredFormat;
	}
	if (hasSquareLocked) {
		return 'square';
	}
	const smallestBlocks = row.blocks.filter((_, i) => fractions[i] === minFraction);
	const smallestSlotPrefs: FormatPreference[] = smallestBlocks.map((b) =>
		b.type === 'gallery' ? b.preferredFormat : 'square'
	);
	const requested = strongestPreference(smallestSlotPrefs);
	return requested === 'portrait' && minFraction > 1 / 3 ? 'square' : requested;
}

export function smallestSlotIndex(row: LayoutRow): number {
	const fractions = row.pattern.map((s) => SIZE_FRACTIONS[s]);
	const minFraction = Math.min(...fractions);
	return fractions.indexOf(minFraction);
}

export function rowAspectRatio(row: LayoutRow): string | null {
	if (row.blocks.some((b) => b.type === 'press')) return null;
	const fractions = row.pattern.map((s) => SIZE_FRACTIONS[s]);
	const minFraction = Math.min(...fractions);
	if (minFraction === 1) return '16 / 9';

	// Shape-locked blocks (forced gallery > circle/collab) drive the row aspect
	const forcedGallery = row.blocks.find((b) => b.type === 'gallery' && b.forceFormat);
	const hasSquareLocked = row.blocks.some((b) => b.type === 'circle' || b.type === 'collaborators');

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
