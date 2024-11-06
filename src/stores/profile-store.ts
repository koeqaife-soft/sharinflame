import { defineStore } from "pinia";
import { getProfile, updateProfile } from "src/api/users";

export const useProfileStore = defineStore("profile", {
  state: () => ({
    profile: undefined as User | undefined,
    last_update: 0 as number,
    is_loading: false as boolean
  }),
  getters: {},
  actions: {
    async getProfile() {
      const currentTime = Math.floor(Date.now() / 1000);
      const thirtyMinutes = 30 * 60;

      if (this.is_loading) {
        return new Promise<User | undefined>((resolve) => {
          const interval = setInterval(() => {
            if (!this.is_loading) {
              clearInterval(interval);
              resolve(this.profile);
            }
          }, 100);
        });
      }

      if (!this.profile || currentTime - this.last_update >= thirtyMinutes) {
        this.is_loading = true;
        try {
          const r = await getProfile();
          if (r.status === 200 && r.data.success) {
            this.profile = r.data.data;
            this.last_update = currentTime;
          }
        } finally {
          this.is_loading = false;
        }
      }

      return this.profile;
    },
    async updateProfile(values: UpdateProfileValues) {
      const r = await updateProfile(values);
      if (r.status === 204) {
        this.profile = undefined;
        this.last_update = 0;
      }
    }
  }
});
