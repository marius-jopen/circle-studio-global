import type {
	AboutBlock,
	BlockPosition,
	CircleBlock,
	CollaboratorsBlock,
	GalleryBlock,
	GalleryItem,
	PressBlock,
	PressItem
} from '$lib/types/aboutBlock';
import { DEFAULT_ALLOWED_SIZES, PINNED_TYPES, parseColorToken } from '$lib/types/aboutBlock';

interface SliceLike {
	id?: string;
	slice_type?: string;
	primary?: Record<string, any>;
}

let nonceCounter = 0;
function fallbackId(prefix: string): string {
	nonceCounter += 1;
	return `${prefix}-${nonceCounter}`;
}

function readHideOnMobile(primary: Record<string, any>): boolean {
	return primary.hide_on_mobile === true;
}

function readPosition(primary: Record<string, unknown>): BlockPosition {
	return primary.position === 'top' || primary.position === 'bottom' ? primary.position : 'default';
}

export function sliceToPressBlock(slice: SliceLike): PressBlock {
	const primary = slice.primary ?? {};
	const items = ((primary.items ?? []) as Array<Record<string, any>>).map<PressItem>((i) => ({
		link: i.link ?? null,
		text: i.text ?? null,
		year: i.year ?? null,
		image: i.image ?? null
	}));
	return {
		id: slice.id ?? 'press',
		type: 'press',
		allowedSizes: DEFAULT_ALLOWED_SIZES.press,
		pinned: PINNED_TYPES.has('press'),
		hideOnMobile: readHideOnMobile(primary),
		position: readPosition(primary),
		headline: primary.headline ?? undefined,
		items
	};
}

export function sliceToCollaboratorsBlock(slice: SliceLike): CollaboratorsBlock {
	const primary = slice.primary ?? {};
	const items = ((primary.items ?? []) as Array<{ link?: unknown }>).map((i) => i.link);
	return {
		id: slice.id ?? 'collaborators',
		type: 'collaborators',
		allowedSizes: DEFAULT_ALLOWED_SIZES.collaborators,
		pinned: PINNED_TYPES.has('collaborators'),
		hideOnMobile: readHideOnMobile(primary),
		position: readPosition(primary),
		title: primary.title ?? undefined,
		items,
		takeAutomatically: primary.take_automatically === true
	};
}

export function sliceToCircleBlock(slice: SliceLike): CircleBlock {
	const primary = slice.primary ?? {};
	const items = ((primary.items ?? []) as Array<{ text?: string }>)
		.map((i) => i.text ?? '')
		.map((s) => s.trim())
		.filter(Boolean);
	return {
		id: slice.id ?? fallbackId('circle'),
		type: 'circle',
		allowedSizes: DEFAULT_ALLOWED_SIZES.circle,
		hideOnMobile: readHideOnMobile(primary),
		position: readPosition(primary),
		items,
		headline: primary.headline ?? undefined,
		backgroundColor: parseColorToken(primary.background_color, 'white'),
		textColor: parseColorToken(primary.text_color, 'black'),
		randomize: primary.randomize === true,
		startDegrees: typeof primary.start_degrees === 'number' ? primary.start_degrees : undefined
	};
}

export function sliceToGalleryBlock(slice: SliceLike): GalleryBlock {
	const primary = slice.primary ?? {};
	const items = (primary.items ?? []) as GalleryItem[];
	const pf = primary.preferred_format;
	const preferredFormat =
		pf === 'landscape' || pf === 'portrait' || pf === 'square' ? pf : 'square';
	return {
		id: slice.id ?? fallbackId('gallery'),
		type: 'gallery',
		allowedSizes: DEFAULT_ALLOWED_SIZES.gallery,
		hideOnMobile: readHideOnMobile(primary),
		position: readPosition(primary),
		title: primary.title ?? undefined,
		titleColor: primary.title_color === 'black' ? 'black' : 'white',
		items,
		videoPlaybackMode: (primary.video_playback_mode as 'continuous' | 'restart') ?? 'continuous',
		preferredFormat,
		forceFormat: primary.force_format === true
	};
}

export function slicesToBlocks(slices: SliceLike[]): AboutBlock[] {
	const blocks: AboutBlock[] = [];
	for (const slice of slices) {
		switch (slice.slice_type) {
			case 'about_press':
				blocks.push(sliceToPressBlock(slice));
				break;
			case 'about_collaborators':
				blocks.push(sliceToCollaboratorsBlock(slice));
				break;
			case 'about_circle':
				blocks.push(sliceToCircleBlock(slice));
				break;
			case 'about_gallery':
				blocks.push(sliceToGalleryBlock(slice));
				break;
		}
	}
	return blocks;
}
