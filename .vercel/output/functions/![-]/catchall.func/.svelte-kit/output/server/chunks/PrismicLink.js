import { x as spread_attributes, f as escape_html, c as pop, p as push } from "./index2.js";
import { asLinkAttrs } from "@prismicio/client";
function PrismicLink($$payload, $$props) {
  push();
  const {
    field,
    document,
    rel,
    children,
    $$slots,
    $$events,
    ...restProps
  } = $$props;
  const linkAttrs = asLinkAttrs(field ?? document, {
    rel: typeof rel === "function" ? rel : void 0
  });
  const href = ("href" in restProps ? restProps.href : linkAttrs.href) || "";
  const resolvedRel = typeof rel === "string" ? rel : linkAttrs.rel;
  $$payload.out += `<a${spread_attributes(
    {
      ...linkAttrs,
      rel: resolvedRel,
      href,
      ...restProps
    }
  )}>`;
  if (children) {
    $$payload.out += "<!--[-->";
    children?.($$payload);
    $$payload.out += `<!---->`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `${escape_html(field?.text)}`;
  }
  $$payload.out += `<!--]--></a>`;
  pop();
}
export {
  PrismicLink as P
};
