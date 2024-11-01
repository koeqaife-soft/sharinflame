import { defineStore } from "pinia";
import { getPost, getPosts, KeyOfGetPostsTypes } from "src/api/posts";

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

      for (const item of itemsToLoad) {
        const loaded = await getPost(item[0]);
        if (loaded.data.success) this.loaded.push(loaded.data.data);
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
