import "clsx";
import { c as pop, p as push } from "../../../../chunks/index2.js";
import { S as SliceZone, c as components } from "../../../../chunks/index4.js";
function _page($$payload, $$props) {
  push();
  const { data } = $$props;
  SliceZone($$payload, { slices: data.page.data.slices, components });
  pop();
}
export {
  _page as default
};
