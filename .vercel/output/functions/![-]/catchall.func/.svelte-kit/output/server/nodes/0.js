import * as server from '../entries/pages/_layout.server.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/+layout.server.ts";
export const imports = ["_app/immutable/nodes/0.CIVtHHTz.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/BkpUdax-.js","_app/immutable/chunks/DZyYZwyv.js","_app/immutable/chunks/DP4gmLKk.js","_app/immutable/chunks/DCGBl04v.js","_app/immutable/chunks/B72EyrYE.js"];
export const stylesheets = ["_app/immutable/assets/0.CFIyzGFr.css"];
export const fonts = [];
