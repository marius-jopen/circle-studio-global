import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Using Vercel adapter for proper deployment to Vercel
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
