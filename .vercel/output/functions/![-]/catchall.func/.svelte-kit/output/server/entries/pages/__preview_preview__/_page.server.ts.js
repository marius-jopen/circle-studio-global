import { c as createClient } from "../../../chunks/prismicio.js";
async function load({ fetch, cookies }) {
  const client = createClient({ fetch, cookies });
  const page = await client.getSingle("home");
  const allProjects = await client.getAllByType("projects");
  return {
    page,
    allProjects,
    title: page.data.meta_title || "Circle Studio Global",
    meta_description: page.data.meta_description,
    meta_title: page.data.meta_title,
    meta_image: page.data.meta_image.url
  };
}
function entries() {
  return [{}];
}
export {
  entries,
  load
};
