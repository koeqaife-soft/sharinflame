import { defineStore } from "pinia";
import { getPostsBatch, getPosts, KeyOfGetPostsTypes } from "src/api/posts";

export const usePostsStore = defineStore("posts", {
  state: () => ({
    notLoaded: [] as PostMinimal[],
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
      const itemsToLoad = this.notLoaded.slice(0, count);

      const idsToLoad = itemsToLoad.map((item) => item[0]);
      const loaded = await getPostsBatch(idsToLoad);

      if (loaded.data.success) {
        this.loaded.push(...loaded.data.data.posts);
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
