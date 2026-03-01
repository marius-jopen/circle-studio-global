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
	server: {
		fs: {
			allow: ['./slicemachine.config.json']
		}
	}
});
