import { type AxiosError, isAxiosError } from "axios";
import { defineStore } from "pinia";
import { getPostsBatch, getPosts, type KeyOfGetPostsTypes } from "src/api/posts";

export const usePostsStore = defineStore("posts", {
  state: () => ({
    notLoaded: [] as string[],
    loaded: [] as Post[]
  }),
  getters: {},
  actions: {
    async getPosts(type: KeyOfGetPostsTypes) {
      const r = await getPosts(type);
      if (r.data.success) {
        this.notLoaded = r.data.data.posts;
      }
      return r.data;
    },
    async loadPosts(count: number) {
      let idsToLoad = this.notLoaded.slice(0, count);

      const loadBatch = async (ids: string[]) => {
        let loaded: Awaited<ReturnType<typeof getPostsBatch>>;
        try {
          loaded = await getPostsBatch(ids);
          if (loaded.data.success) {
            this.loaded.push(...loaded.data.data.posts);
          }
          return null;
        } catch (e) {
          if (isAxiosError(e)) {
            const errors = (e as AxiosError<GetPostsBatchResponse>).response?.data?.data?.errors;
            if (errors) {
              return ids.filter((id) => !errors.some((error) => error.post === id));
            }
          }
          throw e;
        }
      };

      for (let i = 0; i < count; i++) {
        if (idsToLoad.length == 0) break;
        const remainingIds = await loadBatch(idsToLoad);
        if (remainingIds === null) {
          break;
        }
        idsToLoad = remainingIds;
      }

      this.notLoaded = this.notLoaded.slice(count);
    },
    reset() {
      this.notLoaded = [];
      this.loaded = [];
    },
    viewPosts(count: number) {
      if (count > this.loaded.length) {
        const elements = [...this.loaded];
        this.loaded = [];
        return elements;
      }

      const elements = this.loaded.slice(-count);
      this.loaded.splice(-count);
      return elements;
    }
  }
});
