import { defineStore } from "pinia";
import * as colors from "../utils/colors";

const defaultSettings = {
  themeHue: 8
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
    initialized: 0 as 0 | 1 | 2,
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
    updateColor(newHue?: number) {
      if (newHue) {
        this.setSettings("themeHue", newHue);
      }
      const hue = newHue || this.getSetting("themeHue");
      const generated = colors.generateAll([hue, 0, 0]);
      colors.setCss(generated);
    }
  }
});
