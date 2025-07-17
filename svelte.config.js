import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter(),
		
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// Log the error for debugging
				console.warn(`HTTP error during prerendering: ${path} (referred from ${referrer}): ${message}`);
				
				// Don't fail the build for 404s or 500s from Prismic
				if (path.includes('/work/') || message.includes('prismic')) {
					console.warn('Ignoring Prismic-related prerender error to prevent build failure');
					return;
				}
				
				// Throw for other errors that we should handle
				throw new Error(message);
			}
		}
	}
};

export default config;
