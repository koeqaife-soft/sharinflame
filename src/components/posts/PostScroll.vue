<template>
  <q-scroll-area class="scroll-area" :visible="false">
    <div class="sticky-label scroll-header" :class="{ 'is-visible': headerVisible }" v-if="$slots['default']">
      <slot />
    </div>
    <my-virtual-scroll
      :items="items"
      :margins="8"
      item-key="post_id"
      infinite-load-type="bottom"
      class="posts-infinite-scroll"
      @load-more="onLoad"
      @scroll="onScroll"
      :key="scrollKey"
      ref="virtualScroll"
    >
      <template v-slot:default="{ item }">
        <post-component class="q-mb-sm" :post="item" @delete-post="handleDeletePost" />
      </template>
      <template v-slot:loading>
        <div class="row justify-center q-my-md">
          <q-spinner class="loading" size="40px" />
        </div>
      </template>
    </my-virtual-scroll>
  </q-scroll-area>
</template>
<script setup lang="ts">
import { ref, watch, defineAsyncComponent, type DefineComponent } from "vue";
import { getPosts, getPostsBatch, type KeyOfGetPostsTypes, viewPosts } from "src/api/posts";
import { type AxiosError, isAxiosError } from "axios";
import { useI18n } from "vue-i18n";
import MyVirtualScroll from "src/components/misc/MyVirtualScroll.vue";

const PostComponent = defineAsyncComponent(() => import("./PostComponent.vue"));

const props = defineProps<{
  type: KeyOfGetPostsTypes;
}>();

const items = ref<PostWithSystem[]>([]);
const scrollKey = ref<string>(props.type);
const toView: string[] = [];

const notLoaded: string[] = [];
const loaded: Post[] = [];

const headerVisible = ref(true);

const virtualScroll = ref<DefineComponent | null>(null);

const { t } = useI18n();

watch(() => props.type, reloadPosts);

function onScroll(info: QScrollObserverDetails) {
  headerVisible.value = info.position.top < 60 || info.direction == "up";
}

function reset() {
  items.value = [];
  toView.length = 0;
  notLoaded.length = 0;
  loaded.length = 0;
  headerVisible.value = true;
}

async function viewInChunks(posts: string[], chunkSize: number = 10) {
  const promises = [];

  while (posts.length > 0) {
    const chunk = posts.splice(0, chunkSize);

    promises.push(viewPosts(chunk));
  }

  await Promise.all(promises);
}

function reloadPosts() {
  reset();
  scrollKey.value = `${props.type}-${Date.now()}`;
}

async function getPostsIds(type: KeyOfGetPostsTypes) {
  const r = await getPosts(type);
  if (r.data.success) {
    notLoaded.push(...r.data.data.posts);
  }
  return r.data;
}

async function loadPosts(count: number) {
  let idsToLoad = notLoaded.slice(0, count);

  const loadBatch = async (ids: string[]) => {
    let response: Awaited<ReturnType<typeof getPostsBatch>>;
    try {
      response = await getPostsBatch(ids);
      if (response.data.success) {
        loaded.push(...response.data.data.posts);
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

  notLoaded.splice(0, count);
}

function getLoaded(count: number) {
  if (count > loaded.length) {
    const elements = [...loaded];
    loaded.length = 0;
    return elements;
  }

  const elements = loaded.slice(-count);
  loaded.splice(-count);
  return elements;
}

async function onLoad(index: number, done: (stop?: boolean) => void) {
  const toLoad = items.value.length == 0 ? 10 : 5;
  try {
    if (loaded.length == 0 && notLoaded.length == 0) {
      if (toView.length > 0) {
        await viewInChunks(toView);
      }
      const r = await getPostsIds(props.type);
      if (!r.success) return;
    }
    if (loaded.length == 0) {
      await loadPosts(toLoad);
    }
    if (loaded.length != 0) {
      const posts = getLoaded(toLoad);

      items.value.push(...posts);

      const postIds = posts.map((post) => post.post_id);
      toView.push(...postIds);
      if (items.value.length >= 20 && toView.length >= 10) {
        void viewInChunks(toView);
      }
    }
    done();
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
  virtualScroll.value?.updateShowedItems();
}
</script>
