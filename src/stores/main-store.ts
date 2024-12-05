import { defineStore } from "pinia";

export const useMainStore = defineStore("main", {
  state: () => ({
    isOffline: true,
    connectTries: 4,
    openedDialogs: {
      user: () => {},
      post: () => {}
    }
  }),
  getters: {},
  actions: {
    setIsOffline(v: boolean) {
      this.isOffline = v;
      if (!v) this.connectTries == 0;
    }
  }
});
