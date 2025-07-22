import * as prismic from "@prismicio/client";
import { createClient as createClient$1 } from "@prismicio/client";
import "clsx";
import "./client.js";
const enableAutoPreviews = (config) => {
  if (!config.cookies) {
    return;
  }
  const cookie = config.cookies.get(prismic.cookie.preview);
  if (cookie && /\.prismic\.io/.test(cookie)) {
    config.client.queryContentFromRef(cookie);
  }
};
const repositoryName$1 = "circle-studio-global";
const sm = {
  repositoryName: repositoryName$1
};
const repositoryName = sm.repositoryName;
const routes = [
  { type: "page", path: "/", uid: "home" },
  { type: "page", path: "/:uid" }
];
const createClient = ({ cookies, ...config } = {}) => {
  const client = createClient$1(repositoryName, {
    routes,
    ...config
  });
  enableAutoPreviews({ client, cookies });
  return client;
};
export {
  createClient as c,
  repositoryName as r
};
