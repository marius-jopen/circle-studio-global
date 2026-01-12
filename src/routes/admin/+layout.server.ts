// No server-side protection needed - client-side only auth
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	return {};
};
