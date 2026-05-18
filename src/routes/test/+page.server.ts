import { createClient } from '$lib/prismicio';
import { slicesToBlocks } from '$lib/utils/aboutSliceMappers';
import type { AboutBlock } from '$lib/types/aboutBlock';
import { DEFAULT_ALLOWED_SIZES } from '$lib/types/aboutBlock';

export const prerender = false;

export async function load({ fetch, cookies }) {
	const client = createClient({ fetch, cookies });

	const library = await client
		.getSingle('about_library' as any)
		.catch(() => null);

	const slices = (library?.data as { slices?: unknown[] })?.slices ?? [];
	const fromPrismic = slicesToBlocks(slices as any[]);

	const blocks: AboutBlock[] =
		fromPrismic.length > 0 ? fromPrismic : getDummyBlocks();

	return { blocks, usingDummyData: fromPrismic.length === 0 };
}

function getDummyBlocks(): AboutBlock[] {
	return [
		{
			id: 'press',
			type: 'press',
			allowedSizes: DEFAULT_ALLOWED_SIZES.press,
			pinned: true,
			headline: 'Press',
			items: [
				{ link: null, text: 'A daring debut', year: '2024', image: null },
				{ link: null, text: 'Reinvents the genre', year: '2023', image: null },
				{ link: null, text: 'Endlessly inventive', year: '2022', image: null }
			]
		},
		{
			id: 'collaborators',
			type: 'collaborators',
			allowedSizes: DEFAULT_ALLOWED_SIZES.collaborators,
			pinned: true,
			title: 'Collaborators'
		},
		{
			id: 'circle-1',
			type: 'circle',
			allowedSizes: DEFAULT_ALLOWED_SIZES.circle,
			backgroundColor: 'white',
			textColor: 'black',
			items: ['hello hello hello', 'art camp est 2016', 'circle studio global']
		},
		{
			id: 'circle-2',
			type: 'circle',
			allowedSizes: DEFAULT_ALLOWED_SIZES.circle,
			backgroundColor: 'white',
			textColor: 'black',
			items: [
				'always something new',
				'always something familiar',
				'always something strange'
			]
		},
		{
			id: 'gallery-1',
			type: 'gallery',
			allowedSizes: DEFAULT_ALLOWED_SIZES.gallery,
			videoPlaybackMode: 'continuous',
			preferredFormat: 'square',
			forceFormat: false,
			items: [
				{ image: { url: 'https://picsum.photos/seed/g1/600/600' } },
				{ image: { url: 'https://picsum.photos/seed/g2/600/600' } },
				{ image: { url: 'https://picsum.photos/seed/g3/600/600' } },
				{ image: { url: 'https://picsum.photos/seed/g4/600/600' } }
			]
		},
		{
			id: 'gallery-2',
			type: 'gallery',
			allowedSizes: DEFAULT_ALLOWED_SIZES.gallery,
			videoPlaybackMode: 'restart',
			preferredFormat: 'portrait',
			forceFormat: false,
			items: [
				{ image: { url: 'https://picsum.photos/seed/g5/600/600' } },
				{ image: { url: 'https://picsum.photos/seed/g6/600/600' } },
				{ image: { url: 'https://picsum.photos/seed/g7/600/600' } },
				{ image: { url: 'https://picsum.photos/seed/g8/600/600' } },
				{ image: { url: 'https://picsum.photos/seed/g9/600/600' } }
			]
		},
		{
			id: 'gallery-3',
			type: 'gallery',
			allowedSizes: DEFAULT_ALLOWED_SIZES.gallery,
			videoPlaybackMode: 'continuous',
			preferredFormat: 'square',
			forceFormat: false,
			items: [
				{ image: { url: 'https://picsum.photos/seed/g10/600/600' } },
				{ image: { url: 'https://picsum.photos/seed/g11/600/600' } }
			]
		},
	];
}
