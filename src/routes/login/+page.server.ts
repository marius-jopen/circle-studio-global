import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		title: 'Admin Login - Art Camp'
	};
};
