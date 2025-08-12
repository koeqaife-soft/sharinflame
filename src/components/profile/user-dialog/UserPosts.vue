<template>
  <div class="card q-mb-sm dialog-section" style="z-index: 2">
    <div class="horizontal-container">
      <my-icon icon="sort" class="icon" />
      <q-select
        class="select"
        v-model="sort"
        :options="sortOptions"
        :option-label="(opt) => $t(`sort.${opt}`)"
        dense
        borderless
        style="min-width: 100px; width: 150px; max-width: 300px"
        @update:model-value="reloadPosts"
      />
      <q-space />
      <div class="horizontal-container" style="gap: 0">
        <my-btn :icon="expand ? 'collapse_content' : 'expand_content'" @click="toggleExpand" />
        <my-button icon="refresh" @click="reloadPosts" />
      </div>
    </div>
  </div>
  <q-scroll-area class="scroll-area full-height fix-scroll-area" :visible="false">
    <my-virtual-scroll
      :items="items"
      :margins="8"
      item-key="post_id"
      @load-more="onLoad"
      infinite-load-type="bottom"
      :key="scrollKey"
      ref="virtualScroll"
    >
      <template v-slot:default="{ item }">
        <post-component :post="item" class="q-mb-sm" @delete-post="handleDeletePost" />
      </template>
      <template v-slot:loading>
        <div class="row justify-center q-my-md">
          <q-spinner class="loading full-height q-my-md" size="40px" />
        </div>
      </template>
    </my-virtual-scroll>
  </q-scroll-area>
</template>
<script setup lang="ts">
import { getUserPosts } from "src/api/posts";
import { defineAsyncComponent, type DefineComponent, ref } from "vue";
import MyVirtualScroll from "src/components/my/MyVirtualScroll.vue";
import MyIcon from "src/components/my/MyIcon.vue";
import MyButton from "src/components/my/MyButton.vue";

const PostComponent = defineAsyncComponent(() => import("../../posts/PostComponent.vue"));

const props = defineProps<{
  user: User;
  meta?: MetaData;
}>();

let cursor: string | undefined;
let hasMore = true;

const virtualScroll = ref<DefineComponent | null>(null);

const expand = defineModel<boolean>("expand");

const items = ref<PostWithSystem[]>([]);
const nextItems = ref<PostWithSystem[]>([]);
const scrollKey = ref(Date.now());
const sortOptions = ["old", "new", "popular"] as const;
const sort = ref<(typeof sortOptions)[number]>("new");

function toggleExpand() {
  expand.value ||= false;
  expand.value = !expand.value;
}

function reloadPosts() {
  items.value = [];
  nextItems.value = [];
  cursor = undefined;
  scrollKey.value = Date.now();
}

async function onLoad(index: number, done: (stop?: boolean) => void) {
  const addCount = items.value.length == 0 ? 10 : 5;
  try {
    const toAdd: PostWithSystem[] = [];

    if (nextItems.value.length === 0) {
      const r = await getUserPosts(props.user.user_id, cursor, sort.value);
      const apiLoaded = r.data.data.posts;
      hasMore = r.data.data.has_more;
      cursor = r.data.data.next_cursor;

      if (r.data.success) {
        const loadedPosts = apiLoaded.map(
          (post) =>
            ({
              ...post,
              user: props.user
            }) as PostWithSystem
        );
        nextItems.value.push(...loadedPosts);
      }
    }

    toAdd.push(...nextItems.value.splice(0, addCount));

    if (toAdd.length > 0) {
      const currentPosts = [...items.value];
      toAdd.forEach((newPost) => {
        const existingIndex = currentPosts.findIndex((post) => post.post_id === newPost.post_id);

        if (existingIndex !== -1) {
          currentPosts[existingIndex] = newPost;
        } else {
          currentPosts.push(newPost);
        }
      });
      items.value = currentPosts;
    }

    done(!(hasMore || nextItems.value.length > 0));
  } catch (e) {
    done(true);
    throw e;
  }
}

function handleDeletePost(postId: string) {
  items.value = items.value.filter((post) => post.post_id !== postId);
  virtualScroll.value?.updateShowedItems();
}
</script>
