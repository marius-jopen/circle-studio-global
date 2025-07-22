import { e as error } from "../../../../../chunks/index.js";
import { c as createClient } from "../../../../../chunks/prismicio.js";
async function load({ params, fetch, cookies }) {
  const client = createClient({ fetch, cookies });
  try {
    const project = await client.getByUID("projects", params.uid);
    return {
      project,
      title: project.data.title || "Project",
      meta_description: project.data.meta_description,
      meta_title: project.data.meta_title,
      meta_image: project.data.meta_image?.url
    };
  } catch (err) {
    console.error(`Failed to fetch project with UID: ${params.uid}`, err);
    throw error(404, `Project not found: ${params.uid}`);
  }
}
async function entries() {
  const client = createClient();
  try {
    const projects = await client.getAllByType("projects");
    return projects.filter((project) => project.uid && project.uid.length > 0).map((project) => {
      return { uid: project.uid };
    });
  } catch (err) {
    console.error("Failed to fetch projects for prerendering:", err);
    return [];
  }
}
export {
  entries,
  load
};
