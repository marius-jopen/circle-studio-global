import { createClient as baseCreateClient, type Route } from '@prismicio/client';
import { type CreateClientConfig, enableAutoPreviews } from '@prismicio/svelte/kit';
import sm from '../../slicemachine.config.json';

/**
 * The project's Prismic repository name.
 */
export const repositoryName = import.meta.env.VITE_PRISMIC_ENVIRONMENT || sm.repositoryName;

/**
 * A list of Route Resolver objects that define how a document's `url` field is resolved.
 *
 * {@link https://prismic.io/docs/route-resolver#route-resolver}
 */
// TODO: Update the routes array to match your project's route structure.
const routes: Route[] = [
	{ type: 'home', path: '/' },
	{ type: 'page', path: '/', uid: 'home' },
	{ type: 'page', path: '/:uid' },
	{ type: 'projects', path: '/work/:uid' },
	// The About Modules Library has no page of its own — it's rendered inside the /test
	// page (and the About page) via the AboutModulesArea slice. Resolve it to /test so
	// Prismic's "Preview the page" button opens a real render instead of the homepage.
	{ type: 'about_library', path: '/test' }
];

/**
 * Creates a Prismic client for the project's repository. The client is used to
 * query content from the Prismic API.
 *
 * @param config - Configuration for the Prismic client.
 */
export const createClient = ({ cookies, ...config }: CreateClientConfig = {}) => {
	const client = baseCreateClient(repositoryName, {
		routes,
		...config
	});

	enableAutoPreviews({ client, cookies });

	return client;
};
