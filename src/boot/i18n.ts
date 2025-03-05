import { createI18n } from "vue-i18n";
import messages from "src/i18n";
import type { App } from "vue";

export const i18n = createI18n({
  locale: "en-US",
  legacy: false,
  messages
});

export default ({ app }: { app: App }) => {
  app.use(i18n);
};
