import { d as attr, k as attr_class, j as bind_props, c as pop, p as push, h as head, f as escape_html, e as ensure_array_like } from "../../../../../chunks/index2.js";
import { P as PrismicImage, a as PrismicRichText, S as SliceZone, c as components } from "../../../../../chunks/index4.js";
import { h as fallback } from "../../../../../chunks/utils.js";
function VideoAdvanced($$payload, $$props) {
  push();
  let videoUrl, useHls;
  let hlsUrl = $$props["hlsUrl"];
  let posterImage = fallback($$props["posterImage"], null);
  let classes = fallback($$props["classes"], "w-full h-auto rounded object-cover mb-4");
  let shouldAutoplay = fallback($$props["shouldAutoplay"], false);
  videoUrl = hlsUrl.replace(".m3u8", ".mp4");
  useHls = hlsUrl && hlsUrl.includes(".m3u8");
  $$payload.out += `<video${attr("autoplay", shouldAutoplay, true)} loop${attr("muted", !shouldAutoplay, true)} playsinline controls${attr_class(classes)}${attr("poster", posterImage?.url || "")} preload="metadata">`;
  if (useHls) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<source${attr("src", hlsUrl)} type="application/x-mpegURL"/> <source${attr("src", videoUrl)} type="video/mp4"/>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<source${attr("src", videoUrl)} type="video/mp4"/>`;
  }
  $$payload.out += `<!--]--> <track kind="captions" src="" label="Captions"/> Your browser does not support the video tag.</video>`;
  bind_props($$props, {
    hlsUrl,
    posterImage,
    classes,
    shouldAutoplay
  });
  pop();
}
function _page($$payload, $$props) {
  push();
  const { data } = $$props;
  const project = data.project;
  const projectData = project.data;
  let cameFromNavigation = false;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(data.title)}</title>`;
    if (data.meta_description) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<meta name="description"${attr("content", data.meta_description)}/>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (data.meta_title) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<meta property="og:title"${attr("content", data.meta_title)}/>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (data.meta_image) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<meta property="og:image"${attr("content", data.meta_image)}/>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]-->`;
  });
  $$payload.out += `<div class="mx-auto px-3">`;
  if (projectData.main_video_url || projectData.main_image?.url) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="mb-12">`;
    if (projectData.main_video_url) {
      $$payload.out += "<!--[-->";
      VideoAdvanced($$payload, {
        hlsUrl: projectData.main_video_url,
        posterImage: projectData.main_image,
        classes: "w-full h-auto rounded-lg object-cover aspect-video",
        shouldAutoplay: cameFromNavigation
      });
    } else if (projectData.main_image?.url) {
      $$payload.out += "<!--[1-->";
      PrismicImage($$payload, {
        field: projectData.main_image,
        class: "w-full h-auto rounded-lg object-cover"
      });
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="mb-12"><h1 class="text-4xl md:text-6xl font-bold mb-4">${escape_html(projectData.title)}</h1> `;
  if (projectData.client) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p class="text-xl text-gray-600 mb-6">${escape_html(projectData.client)}</p>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (projectData.description) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="prose prose-lg max-w-none">`;
    PrismicRichText($$payload, { field: projectData.description });
    $$payload.out += `<!----></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  if (projectData.credits && projectData.credits.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(projectData.credits);
    $$payload.out += `<section class="mb-12"><h2 class="text-2xl font-bold mb-6">Credits</h2> <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let credit = each_array[$$index];
      $$payload.out += `<div class="bg-gray-50 p-4 rounded-lg">`;
      if (credit.label) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<h3 class="font-semibold text-gray-800 mb-2">${escape_html(credit.label)}</h3>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (credit.person && "data" in credit.person && credit.person.data?.name) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<p class="text-gray-600">`;
        if (credit.person.data.link && "url" in credit.person.data.link && credit.person.data.link.url) {
          $$payload.out += "<!--[-->";
          $$payload.out += `<a${attr("href", credit.person.data.link.url)} class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">${escape_html(credit.person.data.name)}</a>`;
        } else {
          $$payload.out += "<!--[!-->";
          $$payload.out += `${escape_html(credit.person.data.name)}`;
        }
        $$payload.out += `<!--]--></p>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div>`;
    }
    $$payload.out += `<!--]--></div></section>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (projectData.slices && projectData.slices.length > 0) {
    $$payload.out += "<!--[-->";
    SliceZone($$payload, { slices: projectData.slices, components });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
