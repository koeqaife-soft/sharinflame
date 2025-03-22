import { defineStore } from "pinia";
import * as colors from "../utils/colors";

const cacheVersion = 1;

const defaultSettings = {
  themeHue: 8,
  darkMode: "auto" as boolean | "auto",
  currentTheme: "default" as "default" | "monochrome" | "contrast",
  starBackground: false
};

type KeyOfSettings = keyof typeof defaultSettings;

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
    isOffline: true,
    connectTries: 4,
    openedDialogs: {
      user: () => {},
      post: () => {}
    },
    settings: getSettings()
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
      let generated: Record<string, string>;

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

      colors.setCss(generated!);
    }
  }
});
