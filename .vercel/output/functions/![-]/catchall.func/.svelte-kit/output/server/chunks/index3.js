import { s as stores } from "./client.js";
import { g as getContext } from "./index2.js";
({
  check: stores.updated.check
});
function context() {
  return getContext("__request__");
}
const page$1 = {
  get data() {
    return context().page.data;
  },
  get error() {
    return context().page.error;
  },
  get status() {
    return context().page.status;
  }
};
const page = page$1;
export {
  page as p
};
