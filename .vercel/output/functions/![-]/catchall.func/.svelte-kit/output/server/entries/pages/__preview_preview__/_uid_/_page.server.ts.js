import { asText } from "@prismicio/client";
import { e as error } from "../../../../chunks/index.js";
import { c as createClient } from "../../../../chunks/prismicio.js";
async function load({ params, fetch, cookies }) {
  const client = createClient({ fetch, cookies });
  try {
    const page = await client.getByUID("page", params.uid);
    return {
      page,
      title: asText(page.data.title),
      meta_description: page.data.meta_description,
      meta_title: page.data.meta_title,
      meta_image: page.data.meta_image.url
    };
  } catch (err) {
    console.error(`Failed to fetch page with UID: ${params.uid}`, err);
    throw error(404, `Page not found: ${params.uid}`);
  }
}
async function entries() {
  const client = createClient();
  try {
    const pages = await client.getAllByType("page");
    return pages.filter((page) => page.uid && page.uid.length > 0).map((page) => {
      return { uid: page.uid };
    });
  } catch (err) {
    console.error("Failed to fetch pages for prerendering:", err);
    return [];
  }
}
export {
  entries,
  load
};
