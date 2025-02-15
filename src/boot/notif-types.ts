import { Notify } from "quasar";
import { defineBoot } from "#q-app/wrappers";

export default defineBoot(() => {
  Notify.registerType("default-notification", {
    icon: "sym_r_notifications",
    classes: "default-notification",
    position: "top-right"
  });
  Notify.registerType("error-notification", {
    icon: "sym_r_error",
    classes: "error-notification",
    position: "top-right"
  });
});
