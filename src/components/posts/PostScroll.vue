<template>
  <!-- FIXME: Lags with a large number of elements -->
  <q-scroll-area class="scroll-area" :visible="false">
    <q-infinite-scroll @load="onLoad" class="posts-infinite-scroll" :key="scrollKey" debounce="0">
      <post-component
        :post="item"
        v-for="item in items"
        :key="item.post_id"
        class="animation-fade-in-down"
        @delete-post="handleDeletePost"
      />
      <template v-slot:loading v-if="items.length > 0">
        <div class="row justify-center q-my-md">
          <q-spinner class="loading" size="40px" />
        </div>
      </template>
    </q-infinite-scroll>
  </q-scroll-area>
</template>
<script setup lang="ts">
import { ref, watch, defineAsyncComponent } from "vue";
import { usePostsStore } from "src/stores/posts-store";
import { KeyOfGetPostsTypes, viewPosts } from "src/api/posts";
import { isAxiosError } from "axios";
import { useI18n } from "vue-i18n";

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
    setTimeout(() => done(), 200);
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
