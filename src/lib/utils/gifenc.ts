/**
 * Lazy loader for `gifenc`.
 *
 * `gifenc` ships an ESM build with a `.js` extension and no `"type": "module"`,
 * so Node's CJS loader chokes on it ("Unexpected token 'export'"). Importing it
 * statically pulls it into the SSR bundle and crashes every server-rendered
 * page. It's a canvas-only encoder, so load it on demand in the browser instead.
 */
type Gifenc = typeof import('gifenc');

let gifencPromise: Promise<Gifenc> | null = null;

export function loadGifenc(): Promise<Gifenc> {
	if (!gifencPromise) {
		gifencPromise = import('gifenc');
	}
	return gifencPromise;
}
