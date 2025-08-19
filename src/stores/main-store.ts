import { defineStore } from "pinia";
import * as colors from "../utils/colors";
import { useQuasar } from "quasar";
import { getUnreadNotificationsCount } from "src/api/users";
import { defineAsyncComponent } from "vue";

const cacheVersion = 3;

const defaultSettings = {
  themeHue: 8,
  darkMode: "auto" as boolean | "auto",
  currentTheme: "default" as "default" | "monochrome" | "contrast",
  starBackground: false
};

type KeyOfSettings = keyof typeof defaultSettings;

type OpenedDialogs = Map<
  string,
  {
    key: string;
    hide: () => void;
  }
>;

const dialogs = {
  user: defineAsyncComponent(() => import("src/components/profile/UserDialog.vue")),
  settings: defineAsyncComponent(() => import("src/components/settings/SettingsDialog.vue")),
  post: defineAsyncComponent(() => import("src/components/posts/PostDialog.vue")),
  myActivity: defineAsyncComponent(() => import("src/components/my-activity/MyActivityDialog.vue")),
  postEditor: defineAsyncComponent(() => import("src/components/posts/PostEditor.vue"))
} as const;

const getSettings = () => {
  const stored = JSON.parse(localStorage.getItem("settings") || "{}");
  return { ...defaultSettings, ...stored };
};

const setSettingsKey = (key: string, value: unknown) => {
  const stored = JSON.parse(localStorage.getItem("settings") || "{}");
  stored[key] = value;
  localStorage.setItem("settings", JSON.stringify(stored));
};

export const useMainStore = defineStore("main", {
  state: () => ({
    // 0 -> App just started
    // 1 -> Needs auth
    // 2 -> Auth completed
    // 3 -> First opened
    initialized: 0 as 0 | 1 | 2 | 3,
    isOffline: false,
    connectTries: 0,
    openedDialogs: new Map() as OpenedDialogs,
    settings: getSettings(),
    lastNotifications: [] as ApiNotification[],
    quasar: useQuasar(),
    unreadCount: -1
  }),
  getters: {},
  actions: {
    setIsOffline(v: boolean) {
      this.isOffline = v;
      if (!v) this.connectTries = 0;
    },
    setSettings(key: KeyOfSettings, value: unknown) {
      this.settings[key] = value;
      setSettingsKey(key, value);
    },
    getSetting(key: KeyOfSettings) {
      return this.settings[key];
    },
    updateColor(isStart: boolean = false, newHue?: number, save: boolean = true, newTheme?: string) {
      if (save) {
        if (newHue) this.setSettings("themeHue", newHue);
        if (newTheme) this.setSettings("currentTheme", newTheme);
      }
      const hue = newHue || this.getSetting("themeHue");
      const theme = newTheme || this.getSetting("currentTheme");
      let generated: { dark: Record<string, string>; light: Record<string, string> } | undefined;

      const generate = () => {
        generated = colors.generateAll([hue, 0, 0], theme);
        const cache = {
          generated,
          hue,
          theme,
          cacheVersion
        };
        localStorage.setItem("cached_palette", JSON.stringify(cache));
      };

      if (isStart) {
        const cached = localStorage.getItem("cached_palette");
        if (cached) {
          const generatedOld = JSON.parse(cached);
          if (generatedOld.hue == hue && generatedOld.theme == theme && generatedOld.cacheVersion == cacheVersion)
            generated = generatedOld.generated;
          else generate();
        } else generate();
      } else generate();

      let palette: Record<string, string> = {};
      if (this.quasar.dark.isActive) {
        palette = generated!.dark;
      } else {
        palette = generated!.light;
      }
      colors.setCss(palette);
    },
    addNotification(notification: ApiNotification) {
      const index = this.lastNotifications.findIndex((n) => n.id === notification.id);

      if (index !== -1) {
        this.lastNotifications[index] = notification;
      } else {
        this.lastNotifications.unshift(notification);
      }

      if (this.lastNotifications.length > 5) {
        this.lastNotifications.splice(5);
      }
    },
    getUnreadCount() {
      if (this.unreadCount === -1) {
        void getUnreadNotificationsCount().then((v) => {
          this.unreadCount = v.data.data.count;
        });
      }
      return this.unreadCount;
    },
    openDialog(name: keyof typeof dialogs, key: string, props: Record<string, unknown>) {
      const existingDialog = this.openedDialogs.get(name);
      if (existingDialog) {
        try {
          existingDialog.hide();
        } catch {
          // noop
        }
      }

      const component = dialogs[name];

      const dialog = this.quasar.dialog({
        component: component,
        componentProps: props
      });

      this.openedDialogs.set(name, {
        key: key,
        hide: () => dialog.hide()
      });
    }
  }
});
