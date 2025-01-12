<template>
  <q-scroll-area class="scroll-area" :visible="false">
    <my-virtual-scroll
      :items="items"
      :margins="8"
      item-key="post_id"
      infinite-load-type="bottom"
      class="posts-infinite-scroll"
      @load-more="onLoad"
      :key="scrollKey"
    >
      <template v-slot:default="{ item }">
        <post-component class="animation-fade-in q-mb-sm" :post="item" @delete-post="handleDeletePost" />
      </template>
      <template v-slot:loading>
        <q-spinner class="loading" size="40px" />
      </template>
    </my-virtual-scroll>
  </q-scroll-area>
</template>
<script setup lang="ts">
import { ref, watch, defineAsyncComponent } from "vue";
import { usePostsStore } from "src/stores/posts-store";
import { KeyOfGetPostsTypes, viewPosts } from "src/api/posts";
import { isAxiosError } from "axios";
import { useI18n } from "vue-i18n";
import MyVirtualScroll from "src/components/misc/MyVirtualScroll.vue";

const PostComponent = defineAsyncComponent(() => import("./PostComponent.vue"));

const props = defineProps<{
  type: KeyOfGetPostsTypes;
}>();

const items = ref<PostWithSystem[]>([]);
const scrollKey = ref<string>(props.type);
const store = usePostsStore();
const toView: string[] = [];

const { t } = useI18n();

watch(() => props.type, onTypeChange);

function onTypeChange() {
  items.value = [];
  toView.length = 0;
  store.reset();
  scrollKey.value = `${props.type}-${Date.now()}`;
}

function viewInChunks(posts: string[], ignoreLastChunk: boolean = false, chunkSize: number = 10) {
  while (posts.length > 0) {
    if (ignoreLastChunk && posts.length <= chunkSize) break;

    const chunk = posts.splice(0, chunkSize);

    viewPosts(chunk);
  }
}
function reloadPosts() {
  items.value = [];
  store.reset();
  scrollKey.value = `${props.type}-${Date.now()}`;
}

async function onLoad(index: number, done: (stop?: boolean) => void) {
  const toLoad = items.value.length == 0 ? 10 : 5;
  try {
    if (store.loaded.length == 0 && store.notLoaded.length == 0) {
      if (toView.length > 0) {
        viewInChunks(toView);
      }
      const r = await store.getPosts(props.type);
      if (!r.success) return;
    }
    if (store.loaded.length == 0) {
      await store.loadPosts(toLoad);
    }
    if (store.loaded.length != 0) {
      const posts = store.viewPosts(toLoad);

      items.value.push(...posts);

      const postIds = posts.map((post) => post.post_id);
      toView.push(...postIds);
      if (toView.length >= 20) {
        viewInChunks(toView, true);
      }
    }
    setTimeout(() => done(), 100);
  } catch (e) {
    if (isAxiosError(e)) {
      const error =
        e.response?.data?.error == "NO_MORE_POSTS" ? t("no_more_posts") : e.response?.data?.error.toLowerCase();
      items.value.push({
        is_system: true,
        post_id: `${Date.now()}`,
        content: `<b>${t("an_error_occurred")}:</b> ${error}.\n${t("try_reloading_feed")}.`,
        actions: [
          {
            name: "reload",
            icon: "sym_r_refresh",
            func: () => reloadPosts()
          }
        ]
      });
      done(true);
    } else throw e;
  }
}

function handleDeletePost(postId: string) {
  items.value = items.value.filter((post) => post.post_id !== postId);
}
</script>
