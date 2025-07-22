import { h as head, c as pop, p as push, d as attr, e as ensure_array_like, f as escape_html } from "../../chunks/index2.js";
import "../../chunks/client.js";
import { getToolbarSrc } from "@prismicio/client";
import { P as PrismicLink } from "../../chunks/PrismicLink.js";
import { p as page } from "../../chunks/index3.js";
import { r as repositoryName } from "../../chunks/prismicio.js";
function PrismicPreview($$payload, $$props) {
  push();
  const {
    repositoryName: repositoryName2
  } = $$props;
  const toolbarSrc = getToolbarSrc(repositoryName2);
  head($$payload, ($$payload2) => {
    $$payload2.out += `<script defer${attr("src", toolbarSrc)}><\/script><!---->`;
  });
  pop();
}
function _layout($$payload, $$props) {
  push();
  let { children, data } = $$props;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(page.data.title)}</title>`;
    if (page.data.meta_description) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<meta name="description"${attr("content", page.data.meta_description)}/>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (page.data.meta_title) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<meta name="og:title"${attr("content", page.data.meta_title)}/>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (page.data.meta_image) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<meta name="og:image"${attr("content", page.data.meta_image)}/> <meta name="twitter:card" content="summary_large_image"/>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]-->`;
  });
  if (data.settings?.data?.navigation_header) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(data.settings.data.navigation_header);
    $$payload.out += `<header class="sticky top-0 z-50 bg-white border-b border-gray-200"><nav class="container mx-auto px-4 py-4"><div class="flex items-center justify-between"><a href="/" class="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">Circle Studio Global</a> <ul class="flex items-center space-x-6"><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let navItem = each_array[$$index];
      $$payload.out += `<li>`;
      PrismicLink($$payload, {
        field: navItem,
        class: "text-gray-700 hover:text-gray-900 transition-colors font-medium",
        children: ($$payload2) => {
          $$payload2.out += `<!---->${escape_html(navItem.text || "Link")}`;
        },
        $$slots: { default: true }
      });
      $$payload.out += `<!----></li>`;
    }
    $$payload.out += `<!--]--></ul></div></nav></header>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <main>`;
  children($$payload);
  $$payload.out += `<!----></main> `;
  PrismicPreview($$payload, { repositoryName });
  $$payload.out += `<!---->`;
  pop();
}
export {
  _layout as default
};
