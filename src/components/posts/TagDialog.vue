<template>
  <q-dialog
    transition-show="slide-up"
    transition-hide="slide-down"
    class="tag-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    :key="tagName"
  >
    <closeable-content v-on:hide="dialogRef!.hide()">
      <div class="dialog-header" style="z-index: 2">
        <div class="horizontal-container label-container">
          <my-icon icon="tag" class="header-icon" />
          <div>{{ $t("ctag") }}</div>
          <q-space />
          <my-button icon="close" @click="dialogRef!.hide()" />
        </div>
      </div>

      <div class="dialog-content-inner">
        <q-scroll-area class="scroll-area fix-scroll-area" :visible="false">
          <div ref="tagComponentRef" class="card tag-card">
            <div>
              <my-icon icon="title" />
              <b>{{ $t("tag_name") + ": " }}</b
              >{{ tagName }}
            </div>
            <div>
              <my-icon icon="event" />
              <b>{{ $t("created_at") + ": " }}</b
              >{{ createdAt }}
            </div>
            <div>
              <my-icon icon="history" />
              <b>{{ $t("posts_count") + ": " }}</b> {{ postsCount }}
            </div>
          </div>

          <div class="sticky-label scroll-header q-pt-sm" :class="{ 'is-visible': headerVisible }">
            <div class="card dialog-section q-mb-sm" style="z-index: 2">
              <div class="horizontal-container">
                <my-icon icon="article" class="icon" />
                <div>{{ $t("posts") }}</div>
                <q-space />
                <my-button icon="add_2" @click="createPost" />
                <my-button icon="refresh" @click="reloadPosts" />
              </div>
            </div>
          </div>

          <my-virtual-scroll
            :items="items"
            :margins="8"
            item-key="post_id"
            @load-more="onLoad"
            @scroll="onScroll"
            infinite-load-type="bottom"
            :key="scrollKey"
            class="posts-infinite-scroll"
            ref="virtualScroll"
            :skeleton-height="200"
            no-items-key="no_posts"
          >
            <template v-slot:default="{ item, index }">
              <post-component
                :class="{ 'q-mb-sm': index + 1 < items.length }"
                :post="item"
                @delete-post="handleDeletePost"
              />
            </template>
            <template v-slot:skeleton>
              <rect-skeleton height="200px" class="card q-mb-sm" />
            </template>
          </my-virtual-scroll>
        </q-scroll-area>
      </div>
    </closeable-content>
  </q-dialog>
</template>
<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, type DefineComponent } from "vue";
import { useDialogPluginComponent } from "quasar";
import CloseableContent from "../misc/CloseableContent.vue";
import MyVirtualScroll from "../my/MyVirtualScroll.vue";
import MyIcon from "../my/MyIcon.vue";
import MyButton from "../my/MyButton.vue";
import { useI18n } from "vue-i18n";
import { getPostsBatch, getTag, getTagPosts } from "src/api/posts";
import { type AxiosError, isAxiosError } from "axios";
import { formatUnixTime } from "src/utils/format";
import { useMainStore } from "src/stores/main-store";
import RectSkeleton from "src/components/skeletons/RectSkeleton.vue";

const PostComponent = defineAsyncComponent(() => import("./PostComponent.vue"));

const mainStore = useMainStore();
const { t } = useI18n();
defineEmits([...useDialogPluginComponent.emits]);
const props = defineProps<{
  tagName: string;
}>();

const { dialogRef, onDialogHide } = useDialogPluginComponent();

const tagComponentRef = ref<HTMLElement | null>(null);
let controller = new AbortController();
const headerVisible = ref(true);

const createdAt = computed(() => {
  if (loadedTag.value) {
    return formatUnixTime(loadedTag.value.created_at);
  }
  return t("loading") + "...";
});
const postsCount = computed(() => {
  if (loadedTag.value) {
    return String(loadedTag.value.posts_count);
  }
  return t("loading") + "...";
});
const loadedTag = ref<Tag>();

const items = ref<PostWithSystem[]>([]);
const scrollKey = ref(Date.now());

const notLoaded: string[] = [];
const loaded: Post[] = [];
let cursor: string | undefined = undefined;
let hasMore = true;

const virtualScroll = ref<DefineComponent | null>(null);

function onScroll(info: QScrollObserverDetails) {
  headerVisible.value = info.position.top < tagComponentRef.value!.scrollHeight + 66 || info.direction == "up";
}

function createPost() {
  mainStore.openDialog("postEditor", "", { withCtags: [props.tagName] });
}

function reset() {
  controller.abort();
  controller = new AbortController();
  items.value = [];
  notLoaded.length = 0;
  loaded.length = 0;
  cursor = undefined;
  hasMore = true;
}

function reloadPosts() {
  reset();
  scrollKey.value = Date.now();
}

async function loadPosts(count: number) {
  let idsToLoad = notLoaded.slice(0, count);

  const loadBatch = async (ids: string[]) => {
    let response: Awaited<ReturnType<typeof getPostsBatch>>;
    try {
      response = await getPostsBatch(ids, { signal: controller.signal });
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
  const toLoad = 20;
  try {
    if (loaded.length == 0 && notLoaded.length == 0) {
      if (!hasMore) {
        done(true);
        return;
      }

      const r = await getTagPosts(props.tagName, cursor, { signal: controller.signal });
      if (!r.data.success) {
        done(true);
        return;
      } else {
        hasMore = r.data.data.has_more;
        cursor = r.data.data.next_cursor;
        notLoaded.push(...r.data.data.posts);
      }
    }
    if (loaded.length == 0) {
      await loadPosts(toLoad);
    }
    if (loaded.length != 0) {
      const posts = getLoaded(toLoad);
      const currentItems = items.value;

      posts.forEach((newPost) => {
        const existingIndex = currentItems.findIndex((post) => post.post_id === newPost.post_id);

        if (existingIndex !== -1) {
          currentItems[existingIndex] = newPost;
        } else {
          currentItems.push(newPost);
        }
      });

      items.value = currentItems;
    }
    done();
  } catch (e) {
    if (isAxiosError(e)) {
      if (e.code === "ERR_CANCELED") {
        done(true);
        return;
      }
      if (!e.response) {
        done(true);
        throw e;
      }
      const error = e.response?.data?.error.toLowerCase();
      items.value.push({
        is_system: true,
        post_id: `${Date.now()}`,
        content: `<b>${t("an_error_occurred")}:</b> ${error}.`,
        actions: [
          {
            name: "reload",
            icon: "refresh",
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
  void nextTick(() => virtualScroll.value?.updateShowedItems());
}

onMounted(async () => {
  try {
    const r = await getTag(props.tagName, { signal: controller.signal });
    if (r.data.success) {
      loadedTag.value = r.data.data;
    }
  } catch (e) {
    if (isAxiosError(e) && e.code === "ERR_CANCELED") {
      return;
    }
    throw e;
  }
});

onUnmounted(() => {
  controller.abort();
});
</script>
