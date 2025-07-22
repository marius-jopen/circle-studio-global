import { c as createClient } from "../../chunks/prismicio.js";
const prerender = "auto";
async function load({ fetch, cookies }) {
  const client = createClient({ fetch, cookies });
  try {
    const settings = await client.getSingle("settings");
    return {
      settings
    };
  } catch (error) {
    return {
      settings: null
    };
  }
}
export {
  load,
  prerender
};
