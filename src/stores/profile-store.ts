import { defineStore } from "pinia";
import { getProfile, updateProfile } from "src/api/users";

interface ProfileCacheItem {
  data: User | undefined;
  lastUpdate: number;
  isLoading: boolean;
}

interface ProfileCache {
  [key: string]: ProfileCacheItem;
}

export const useProfileStore = defineStore("profile", {
  state: () => ({
    profiles: {} as ProfileCache,
    cleanupInterval: null as NodeJS.Timeout | null,
    ttl: 5 * 60
  }),
  getters: {
    profile: (state) => state.profiles["me"]?.data
  },
  actions: {
    async getProfile(id: string = "me") {
      if (!this.cleanupInterval) {
        this.startCleanup(this.ttl * 2);
      }
      const currentTime = Math.floor(Date.now() / 1000);

      this.profiles[id] ??= {
        data: undefined,
        lastUpdate: 0,
        isLoading: false
      };
      const profile = this.profiles[id];

      if (profile.isLoading) {
        return new Promise<User | undefined>((resolve) => {
          const interval = setInterval(() => {
            if (!profile.isLoading) {
              clearInterval(interval);
              resolve(profile.data);
            }
          }, 100);
        });
      }

      if (!profile.data || currentTime - profile.lastUpdate >= this.ttl) {
        profile.isLoading = true;
        try {
          const r = await getProfile(id);
          if (r.status === 200 && r.data.success) {
            profile.data = r.data.data;
            profile.lastUpdate = currentTime;
          }
        } finally {
          profile.isLoading = false;
        }
      }

      return profile.data;
    },
    async updateProfile(values: UpdateProfileValues) {
      const r = await updateProfile(values);

      this.profiles["me"] ??= {
        data: undefined,
        lastUpdate: 0,
        isLoading: false
      };
      const profile = this.profiles["me"];

      if (r.status === 204) {
        profile.data = undefined;
        profile.lastUpdate = 0;
      }
    },
    startCleanup(interval: number = 10 * 60) {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      this.cleanupInterval = setInterval(() => {
        const currentTime = Math.floor(Date.now() / 1000);
        for (const id in this.profiles) {
          if (id == "me") continue;

          const profile = this.profiles[id];
          if (currentTime - profile.lastUpdate > this.ttl) {
            delete this.profiles[id];
          }
        }
      }, interval * 1000);
    },
    stopCleanup() {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }
    }
  }
});
