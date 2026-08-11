import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	resolve: {
		alias: {
			gifenc: 'gifenc/dist/gifenc.esm.js'
		}
	},
	ssr: {
		// gifenc's ESM build is a bare `.js` file in a CJS package, so Node refuses to
		// load it from node_modules. Bundle it instead of leaving it as an external.
		noExternal: ['gifenc']
	},
	server: {
		fs: {
			allow: ['./slicemachine.config.json']
		}
	}
});
