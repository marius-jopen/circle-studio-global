import * as server from '../entries/pages/__preview_preview__/_page.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/__preview_preview__/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/[[preview=preview]]/+page.server.ts";
export const imports = ["_app/immutable/nodes/2.CcD4G_re.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/C9doukUu.js","_app/immutable/chunks/BkpUdax-.js","_app/immutable/chunks/DZyYZwyv.js","_app/immutable/chunks/DP4gmLKk.js","_app/immutable/chunks/CdnVzT6N.js","_app/immutable/chunks/C5lYOAdK.js","_app/immutable/chunks/BsXw5xet.js"];
export const stylesheets = ["_app/immutable/assets/index.CHzE061t.css","_app/immutable/assets/2.BOVktNOO.css"];
export const fonts = [];
