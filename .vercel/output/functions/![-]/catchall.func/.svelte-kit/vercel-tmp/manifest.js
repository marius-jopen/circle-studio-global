export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.DPoYit9y.js",app:"_app/immutable/entry/app.CQCGqrmK.js",imports:["_app/immutable/entry/start.DPoYit9y.js","_app/immutable/chunks/DCGBl04v.js","_app/immutable/chunks/BkpUdax-.js","_app/immutable/entry/app.CQCGqrmK.js","_app/immutable/chunks/C5lYOAdK.js","_app/immutable/chunks/BkpUdax-.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/DZyYZwyv.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js')),
			__memo(() => import('../output/server/nodes/3.js')),
			__memo(() => import('../output/server/nodes/4.js'))
		],
		routes: [
			{
				id: "/api/preview",
				pattern: /^\/api\/preview\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/preview/_server.ts.js'))
			},
			{
				id: "/[[preview=preview]]/work/[uid]",
				pattern: /^(?:\/([^/]+))?\/work\/([^/]+?)\/?$/,
				params: [{"name":"preview","matcher":"preview","optional":true,"rest":false,"chained":true},{"name":"uid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/[[preview=preview]]",
				pattern: /^(?:\/([^/]+))?\/?$/,
				params: [{"name":"preview","matcher":"preview","optional":true,"rest":false,"chained":true}],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/[[preview=preview]]/[uid]",
				pattern: /^(?:\/([^/]+))?\/([^/]+?)\/?$/,
				params: [{"name":"preview","matcher":"preview","optional":true,"rest":false,"chained":true},{"name":"uid","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			}
		],
		prerendered_routes: new Set(["/slice-simulator","/slice-simulator/__data.json","/","/__data.json","/work/theory","/work/theory/__data.json","/work/la-felicidad-se-consigue-con-cosas-muy-simples","/work/la-felicidad-se-consigue-con-cosas-muy-simples/__data.json","/work/nike-j39","/work/nike-j39/__data.json","/work/bombo-fabrika-gabriel-garzon-montano","/work/bombo-fabrika-gabriel-garzon-montano/__data.json","/work/sagmeister-123","/work/sagmeister-123/__data.json","/work/sagmeister-now-is-better-manatee","/work/sagmeister-now-is-better-manatee/__data.json","/work/story","/work/story/__data.json","/work/aguita-gabriel-garzon-montano","/work/aguita-gabriel-garzon-montano/__data.json","/work/nike-trash-talk-motion","/work/nike-trash-talk-motion/__data.json","/work/telfar-puff-remix","/work/telfar-puff-remix/__data.json","/work/sagmeister-book","/work/sagmeister-book/__data.json","/work/telfar-pills","/work/telfar-pills/__data.json","/work/telfar-puff","/work/telfar-puff/__data.json","/work/telfar-wallet-loops-test","/work/telfar-wallet-loops-test/__data.json","/work/mariana-trench","/work/mariana-trench/__data.json","/work/telfar-puff-party","/work/telfar-puff-party/__data.json","/work/proenza-schouler-monogram-film","/work/proenza-schouler-monogram-film/__data.json","/work/my-balloon","/work/my-balloon/__data.json","/work/sagmeister-beautiful-numbers","/work/sagmeister-beautiful-numbers/__data.json","/work/crawl-gabriel-garzon-montano","/work/crawl-gabriel-garzon-montano/__data.json","/work/marine-now","/work/marine-now/__data.json","/work/telfar-smedium","/work/telfar-smedium/__data.json","/work/telfar-bps","/work/telfar-bps/__data.json","/work/moynat","/work/moynat/__data.json","/work/la-belle-est-la-bete","/work/la-belle-est-la-bete/__data.json","/work/nike-luca","/work/nike-luca/__data.json","/work/ride-or-die","/work/ride-or-die/__data.json","/work/loved-ones","/work/loved-ones/__data.json","/work/sagmeister-illy-cups","/work/sagmeister-illy-cups/__data.json","/work/mitski-a-pearl","/work/mitski-a-pearl/__data.json","/work/nike-aja","/work/nike-aja/__data.json","/work/telfar-wallet-loops","/work/telfar-wallet-loops/__data.json","/work/thom-yorke","/work/thom-yorke/__data.json","/work/telfar-wallets","/work/telfar-wallets/__data.json","/play","/play/__data.json","/about","/about/__data.json"]),
		matchers: async () => {
			const { match: preview } = await import ('../output/server/entries/matchers/preview.js')
			return { preview };
		},
		server_assets: {}
	}
}
})();
