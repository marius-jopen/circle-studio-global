import { p as push, d as attr, c as pop, x as spread_attributes, k as attr_class, v as clsx, e as ensure_array_like, f as escape_html, y as spread_props, j as bind_props, m as stringify } from "./index2.js";
import "clsx";
import { isFilled, asImagePixelDensitySrcSet, asImageWidthSrcSet } from "@prismicio/client";
import { h as fallback } from "./utils.js";
import { asTree } from "@prismicio/client/richtext";
import { P as PrismicLink } from "./PrismicLink.js";
function html(value) {
  var html2 = String(value ?? "");
  var open = "<!---->";
  return open + html2 + "<!---->";
}
function PrismicEmbed($$payload, $$props) {
  push();
  const { field } = $$props;
  if (isFilled.embed(field)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div${attr("data-oembed", field.embed_url)}${attr("data-oembed-type", field.type)}${attr("data-oembed-provider", field.provider_name)}>${html(field.html)}</div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function PrismicImage($$payload, $$props) {
  push();
  const {
    field,
    imgixParams = {},
    alt,
    fallbackAlt,
    width,
    height,
    widths,
    pixelDensities,
    $$slots,
    $$events,
    ...restProps
  } = $$props;
  const { resolvedWidth, resolvedHeight } = (() => {
    if (!isFilled.imageThumbnail(field)) return {
      resolvedWidth: void 0,
      resolvedHeight: void 0
    };
    const ar = field.dimensions.width / field.dimensions.height;
    let resolvedWidth2 = castInt(width) ?? field.dimensions.width;
    let resolvedHeight2 = castInt(height) ?? field.dimensions.height;
    if (resolvedWidth2 != null && resolvedHeight2 == null) {
      resolvedHeight2 = resolvedWidth2 / ar;
    } else if (resolvedWidth2 == null && resolvedHeight2 != null) {
      resolvedWidth2 = resolvedHeight2 * ar;
    }
    return { resolvedWidth: resolvedWidth2, resolvedHeight: resolvedHeight2 };
  })();
  const { src, srcset } = (() => {
    if (!isFilled.imageThumbnail(field)) return { src: void 0, srcset: void 0 };
    if (pixelDensities) {
      return asImagePixelDensitySrcSet(field, {
        ...imgixParams,
        pixelDensities: pixelDensities === "defaults" ? void 0 : pixelDensities
      });
    }
    return asImageWidthSrcSet(field, {
      ...imgixParams,
      widths: widths === "defaults" ? void 0 : widths
    });
  })();
  function castInt(input) {
    if (typeof input === "number" || typeof input === "undefined" || input === null) {
      return input;
    } else {
      const parsed = Number.parseInt(input);
      if (Number.isNaN(parsed)) {
        return void 0;
      } else {
        return parsed;
      }
    }
  }
  if (isFilled.imageThumbnail(field)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<img${spread_attributes(
      {
        src,
        srcset,
        alt: alt ?? (field.alt || fallbackAlt),
        width: resolvedWidth,
        height: resolvedHeight,
        ...restProps
      }
    )} onload="this.__e=event" onerror="this.__e=event"/>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function DefaultComponent($$payload, $$props) {
  push();
  const { node, children } = $$props;
  const dirProp = "direction" in node && node.direction === "rtl" ? { direction: "rtl" } : {};
  if (node.type === "heading1") {
    $$payload.out += "<!--[-->";
    $$payload.out += `<h1${spread_attributes({ ...dirProp })}>`;
    children($$payload);
    $$payload.out += `<!----></h1>`;
  } else if (node.type === "heading2") {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<h2${spread_attributes({ ...dirProp })}>`;
    children($$payload);
    $$payload.out += `<!----></h2>`;
  } else if (node.type === "heading3") {
    $$payload.out += "<!--[2-->";
    $$payload.out += `<h3${spread_attributes({ ...dirProp })}>`;
    children($$payload);
    $$payload.out += `<!----></h3>`;
  } else if (node.type === "heading4") {
    $$payload.out += "<!--[3-->";
    $$payload.out += `<h4${spread_attributes({ ...dirProp })}>`;
    children($$payload);
    $$payload.out += `<!----></h4>`;
  } else if (node.type === "heading5") {
    $$payload.out += "<!--[4-->";
    $$payload.out += `<h5${spread_attributes({ ...dirProp })}>`;
    children($$payload);
    $$payload.out += `<!----></h5>`;
  } else if (node.type === "heading6") {
    $$payload.out += "<!--[5-->";
    $$payload.out += `<h6${spread_attributes({ ...dirProp })}>`;
    children($$payload);
    $$payload.out += `<!----></h6>`;
  } else if (node.type === "paragraph") {
    $$payload.out += "<!--[6-->";
    $$payload.out += `<p${spread_attributes({ ...dirProp })}>`;
    children($$payload);
    $$payload.out += `<!----></p>`;
  } else if (node.type === "preformatted") {
    $$payload.out += "<!--[7-->";
    $$payload.out += `<pre>`;
    children($$payload);
    $$payload.out += `<!----></pre>`;
  } else if (node.type === "strong") {
    $$payload.out += "<!--[8-->";
    $$payload.out += `<strong>`;
    children($$payload);
    $$payload.out += `<!----></strong>`;
  } else if (node.type === "em") {
    $$payload.out += "<!--[9-->";
    $$payload.out += `<em>`;
    children($$payload);
    $$payload.out += `<!----></em>`;
  } else if (node.type === "list-item") {
    $$payload.out += "<!--[10-->";
    $$payload.out += `<li${spread_attributes({ ...dirProp })}>`;
    children($$payload);
    $$payload.out += `<!----></li>`;
  } else if (node.type === "o-list-item") {
    $$payload.out += "<!--[11-->";
    $$payload.out += `<li${spread_attributes({ ...dirProp })}>`;
    children($$payload);
    $$payload.out += `<!----></li>`;
  } else if (node.type === "group-list-item") {
    $$payload.out += "<!--[12-->";
    $$payload.out += `<ul>`;
    children($$payload);
    $$payload.out += `<!----></ul>`;
  } else if (node.type === "group-o-list-item") {
    $$payload.out += "<!--[13-->";
    $$payload.out += `<ol>`;
    children($$payload);
    $$payload.out += `<!----></ol>`;
  } else if (node.type === "image") {
    $$payload.out += "<!--[14-->";
    $$payload.out += `<p class="block-img">`;
    PrismicImage($$payload, { field: node });
    $$payload.out += `<!----></p>`;
  } else if (node.type === "embed") {
    $$payload.out += "<!--[15-->";
    PrismicEmbed($$payload, { field: node.oembed });
  } else if (node.type === "hyperlink") {
    $$payload.out += "<!--[16-->";
    PrismicLink($$payload, {
      field: node.data,
      children: ($$payload2) => {
        children($$payload2);
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    });
  } else if (node.type === "label") {
    $$payload.out += "<!--[17-->";
    $$payload.out += `<span${attr_class(clsx(node.data.label))}>`;
    children($$payload);
    $$payload.out += `<!----></span>`;
  } else {
    $$payload.out += "<!--[!-->";
    const each_array = ensure_array_like(node.text.split("\n"));
    $$payload.out += `<!--[-->`;
    for (let index = 0, $$length = each_array.length; index < $$length; index++) {
      let line = each_array[index];
      if (index > 0) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<br/>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]-->${escape_html(line)}`;
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function Serialize_1($$payload, $$props) {
  push();
  const { components: components2, children } = $$props;
  const CHILD_TYPE_RENAMES = {
    "list-item": "listItem",
    "o-list-item": "oListItem",
    "group-list-item": "list",
    "group-o-list-item": "oList"
  };
  function getComponent(child) {
    return components2[CHILD_TYPE_RENAMES[child.type] || child.type] || DefaultComponent;
  }
  const each_array = ensure_array_like(children);
  $$payload.out += `<!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let child = each_array[$$index];
    const Component = getComponent(child);
    $$payload.out += `<!---->`;
    Component($$payload, {
      node: child.node,
      children: ($$payload2) => {
        if (child.children.length > 0) {
          $$payload2.out += "<!--[-->";
          Serialize_1($$payload2, { children: child.children, components: components2 });
        } else {
          $$payload2.out += "<!--[!-->";
        }
        $$payload2.out += `<!--]-->`;
      },
      $$slots: { default: true }
    });
    $$payload.out += `<!---->`;
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function PrismicRichText($$payload, $$props) {
  push();
  const { field, components: components2 = {} } = $$props;
  const children = asTree(field).children;
  Serialize_1($$payload, { children, components: components2 });
  pop();
}
function TodoComponent($$payload, $$props) {
  push();
  const { slice } = $$props;
  "slice_type" in slice ? slice.slice_type : slice.type;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function SliceZone($$payload, $$props) {
  push();
  const {
    slices = [],
    components: components2 = {},
    context = {},
    defaultComponent = void 0
  } = $$props;
  const each_array = ensure_array_like(slices);
  $$payload.out += `<!--[-->`;
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let slice = each_array[index];
    const type = "slice_type" in slice ? slice.slice_type : slice.type;
    const Component = components2[type] || defaultComponent;
    if (Component) {
      $$payload.out += "<!--[-->";
      if (slice.__mapped) {
        $$payload.out += "<!--[-->";
        const { __mapped, ...mappedProps } = slice;
        $$payload.out += `<!---->`;
        Component($$payload, spread_props([mappedProps]));
        $$payload.out += `<!---->`;
      } else {
        $$payload.out += "<!--[!-->";
        $$payload.out += `<!---->`;
        Component($$payload, { slice, slices, context, index });
        $$payload.out += `<!---->`;
      }
      $$payload.out += `<!--]-->`;
    } else {
      $$payload.out += "<!--[!-->";
      TodoComponent($$payload, { slice });
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function Circle($$payload, $$props) {
  push();
  const { slice } = $$props;
  $$payload.out += `<section${attr("data-slice-type", slice.slice_type)}${attr("data-slice-variation", slice.variation)}>Placeholder component for ${escape_html(slice.slice_type)} (variation: ${escape_html(slice.variation)}) slices. <br/> <strong>You can edit this slice directly in your code editor.</strong></section>`;
  pop();
}
function VideoPreview($$payload, $$props) {
  push();
  let videoUrl, useHls;
  let hlsUrl = $$props["hlsUrl"];
  let posterImage = fallback($$props["posterImage"], null);
  let classes = fallback($$props["classes"], "w-full h-auto rounded object-cover mb-4");
  videoUrl = hlsUrl.replace(".m3u8", ".mp4");
  useHls = hlsUrl && hlsUrl.includes(".m3u8");
  $$payload.out += `<video autoplay loop muted playsinline${attr_class(classes)}${attr("poster", posterImage?.url || "")} preload="metadata">`;
  if (useHls) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<source${attr("src", hlsUrl)} type="application/x-mpegURL"/> <source${attr("src", videoUrl)} type="video/mp4"/>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<source${attr("src", videoUrl)} type="video/mp4"/>`;
  }
  $$payload.out += `<!--]--> <track kind="captions" src="" label="Captions"/> Your browser does not support the video tag.</video>`;
  bind_props($$props, { hlsUrl, posterImage, classes });
  pop();
}
function DocumentationItem($$payload, $$props) {
  push();
  let item = $$props["item"];
  $$payload.out += `<div class="block">`;
  if (item) {
    $$payload.out += "<!--[-->";
    const imageField = item.image;
    const videoUrl = item.video_url;
    if (videoUrl) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="relative">`;
      VideoPreview($$payload, {
        hlsUrl: videoUrl,
        posterImage: imageField,
        classes: "w-full h-auto rounded object-cover"
      });
      $$payload.out += `<!----></div>`;
    } else if (imageField?.url) {
      $$payload.out += "<!--[1-->";
      $$payload.out += `<div class="relative">`;
      PrismicImage($$payload, {
        field: imageField,
        class: "w-full h-auto rounded object-cover"
      });
      $$payload.out += `<!----></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]-->`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, { item });
  pop();
}
function Documentation($$payload, $$props) {
  push();
  const { slice } = $$props;
  const getGridCols = (itemsPerRow) => {
    switch (itemsPerRow) {
      case "1":
        return "grid-cols-1";
      case "2":
        return "grid-cols-1 md:grid-cols-2";
      case "3":
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      case "4":
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
      default:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    }
  };
  const gridClass = getGridCols(slice.primary.items_per_row || "3");
  $$payload.out += `<section${attr("data-slice-type", slice.slice_type)}${attr("data-slice-variation", slice.variation)} class="mx-auto py-2">`;
  if (slice.primary.items && slice.primary.items.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(slice.primary.items);
    $$payload.out += `<div${attr_class(`grid gap-3 ${stringify(gridClass)}`)}><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      DocumentationItem($$payload, { item });
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></section>`;
  pop();
}
function Label($$payload, $$props) {
  push();
  let { node, children } = $$props;
  if (node.data.label === "codespan") {
    $$payload.out += "<!--[-->";
    $$payload.out += `<code>`;
    children($$payload);
    $$payload.out += `<!----></code>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<span${attr_class(clsx(node.data.label))}>`;
    children($$payload);
    $$payload.out += `<!----></span>`;
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function RichText($$payload, $$props) {
  push();
  const { slice } = $$props;
  $$payload.out += `<section class="container svelte-nnr6ct">`;
  PrismicRichText($$payload, {
    field: slice.primary.content,
    components: { label: Label }
  });
  $$payload.out += `<!----></section>`;
  pop();
}
const components = {
  circle: Circle,
  documentation: Documentation,
  rich_text: RichText
};
export {
  PrismicImage as P,
  SliceZone as S,
  VideoPreview as V,
  PrismicRichText as a,
  components as c,
  html as h
};
