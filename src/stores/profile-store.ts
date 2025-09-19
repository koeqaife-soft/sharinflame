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
        this.startCleanup(this.ttl * 3);
      }
      const currentTime = Math.floor(Date.now() / 1000);

      this.profiles[id] ??= {
        data: undefined,
        lastUpdate: 0,
        isLoading: false
      };
      const profile = this.profiles[id];

      const getFunction = async () => {
        profile.isLoading = true;
        try {
          const r = await getProfile(id);
          if (r.status === 200 && r.data.success) {
            profile.data = r.data.data;
            profile.lastUpdate = Math.floor(Date.now() / 1000);
            if (id == "me") {
              this.profiles[profile.data.user_id] = profile;
            }
          }
        } finally {
          profile.isLoading = false;
        }
      };

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

      if (!profile.data) {
        await getFunction();
      } else if (currentTime - profile.lastUpdate >= this.ttl) {
        void getFunction();
      }

      return profile.data;
    },
    async updateProfile(values: UpdateProfileValues, avatarUrl?: string, bannerUrl?: string) {
      await this.getProfile("me");
      const r = await updateProfile(values);
      if (r.status === 204) {
        const profileData = this.profiles["me"]!.data!;
        const keys: (keyof UpdateProfileValues)[] = [
          "display_name",
          "languages",
          "bio",
          "avatar_context_id",
          "banner_context_id"
        ];
        if (avatarUrl !== undefined) profileData["avatar_url"] = avatarUrl;
        if (bannerUrl !== undefined) profileData["banner_url"] = bannerUrl;
        keys.forEach((key) => {
          const value = values[key];
          if (value !== undefined) {
            if (key !== "avatar_context_id" && key !== "banner_context_id")
              profileData[key] = (key === "languages" ? [...(value as string[])] : value) as string & string[];
          }
        });
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

          const profile = this.profiles[id]!;
          if (currentTime - profile.lastUpdate > this.ttl * 2) {
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
