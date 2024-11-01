<template>
  <q-infinite-scroll @load="onLoad" class="posts-infinite-scroll q-mt-sm">
    <div v-for="(item, index) in items" :key="index" class="caption">
      <PostComponent :post="item" class="q-mb-sm" />
    </div>
    <template v-slot:loading>
      <div class="row justify-center q-my-md">
        <q-spinner-dots class="loading" size="40px" />
      </div>
    </template>
  </q-infinite-scroll>
</template>
<script setup lang="ts">
import { ref } from "vue";
import PostComponent from "./PostComponent.vue";
import { usePostsStore } from "src/stores/posts-store";
import { viewPosts } from "src/api/posts";
import { isAxiosError } from "axios";

const items = ref<Post[]>([]);
const store = usePostsStore();

async function onLoad(index: number, done: (stop?: boolean) => void) {
  try {
    if (store.loaded.length == 0 && store.notLoaded.length == 0) {
      const r = await store.getPosts("popular");
      if (!r.success) return;
    }
    if (store.loaded.length == 0) {
      await store.loadPosts(10);
    }
    if (store.loaded.length != 0) {
      const posts = store.viewPosts(5);
      const postIds = posts.map((post) => String(post.post_id));
      await viewPosts(postIds);

      items.value.push(...posts);
    }
    done(false);
  } catch (e) {
    if (isAxiosError(e)) done(true);
    else throw e;
  }
}
</script>
