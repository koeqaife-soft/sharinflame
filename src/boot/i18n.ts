import { createI18n } from "vue-i18n";
import messages from "src/i18n";
import type { App } from "vue";

export default ({ app }: { app: App }) => {
  const i18n = createI18n({
    locale: "en-US",
    legacy: false,
    messages
  });

  app.use(i18n);
};
