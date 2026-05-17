export type BlockSize = 'full' | 'two_thirds' | 'half' | 'third' | 'quarter';

export const SIZE_FRACTIONS: Record<BlockSize, number> = {
	full: 1,
	two_thirds: 2 / 3,
	half: 1 / 2,
	third: 1 / 3,
	quarter: 1 / 4
};

export type BlockType = 'press' | 'collaborators' | 'gallery' | 'circle';

export const DEFAULT_ALLOWED_SIZES: Record<BlockType, BlockSize[]> = {
	press: ['full'],
	collaborators: ['half'],
	gallery: ['full', 'two_thirds', 'half', 'third'],
	circle: ['half', 'third']
};

export const PINNED_TYPES: Set<BlockType> = new Set(['press', 'collaborators']);

export interface GalleryItem {
	image?: { url: string; alt?: string | null } | null;
	video_url?: string | null;
	play?: 'no-sound' | 'has-sound' | 'click-to-play-with-sound';
	hide_on_mobile?: boolean;
	no_rounded_corners?: boolean;
}

export interface PressItem {
	link?: unknown;
	text?: string | null;
	year?: string | null;
	image?: { url: string; alt?: string | null } | null;
}

export interface AboutBlockBase {
	id: string;
	type: BlockType;
	allowedSizes: BlockSize[];
	pinned?: boolean;
}

export type ColorToken = 'white' | 'light_gray' | 'black';

export const BG_CLASS: Record<ColorToken, string> = {
	white: 'bg-white',
	light_gray: 'bg-neutral-100',
	black: 'bg-neutral-900'
};

export const TEXT_HEX: Record<ColorToken, string> = {
	white: '#ffffff',
	light_gray: '#f5f5f5',
	black: '#171717'
};

export function parseColorToken(value: unknown, fallback: ColorToken): ColorToken {
	return value === 'white' || value === 'light_gray' || value === 'black' ? value : fallback;
}

export interface CircleBlock extends AboutBlockBase {
	type: 'circle';
	items: string[];
	backgroundColor: ColorToken;
	textColor: ColorToken;
}

export type FormatPreference = 'square' | 'landscape' | 'portrait';

export const FORMAT_ASPECT: Record<FormatPreference, number> = {
	square: 1,
	landscape: 4 / 3,
	portrait: 3 / 4
};

export interface GalleryBlock extends AboutBlockBase {
	type: 'gallery';
	items: GalleryItem[];
	videoPlaybackMode: 'continuous' | 'restart';
	preferredFormat: FormatPreference;
}

export interface CollaboratorsBlock extends AboutBlockBase {
	type: 'collaborators';
	title?: string;
}

export interface PressBlock extends AboutBlockBase {
	type: 'press';
	headline?: string;
	items: PressItem[];
}

export type AboutBlock =
	| CircleBlock
	| GalleryBlock
	| CollaboratorsBlock
	| PressBlock;

export interface LayoutRow {
	blocks: AboutBlock[];
	pattern: BlockSize[];
}
