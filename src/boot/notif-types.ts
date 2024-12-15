import { Notify } from "quasar";
import { boot } from "quasar/wrappers";

export default boot(({}) => {
  Notify.registerType("default-notification", {
    icon: "sym_r_notifications",
    classes: "default-notification",
    position: "top-right"
  });
});
