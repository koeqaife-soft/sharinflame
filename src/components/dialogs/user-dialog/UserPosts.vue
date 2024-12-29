<template>
  <q-scroll-area class="scroll-area full-height fix-scroll-area" :visible="false">
    <div class="sticky-label">
      <q-card class="card q-mb-sm label-container">
        <div class="horizontal-container">
          <q-icon name="sym_r_sort" class="icon" />
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
          <q-btn
            flat
            round
            :icon="`sym_r_${expand ? 'collapse_content' : 'expand_content'}`"
            size="xs"
            @click="toggleExpand"
          />
          <q-btn flat round icon="sym_r_refresh" size="xs" @click="reloadPosts" />
        </div>
      </q-card>
    </div>
    <q-infinite-scroll @load="onLoad" class="posts-infinite-scroll" :key="scrollKey" debounce="0" :offset="1000">
      <post-component
        :post="item"
        class="animation-fade-in-down"
        v-for="item in items"
        :key="item.post_id"
        @delete-post="handleDeletePost"
      />
      <template v-slot:loading>
        <div class="row justify-center q-my-md">
          <q-spinner class="loading" size="40px" />
        </div>
      </template>
    </q-infinite-scroll>
  </q-scroll-area>
</template>
<script setup lang="ts">
import { getUserPosts } from "src/api/posts";
import { defineAsyncComponent, ref } from "vue";

const PostComponent = defineAsyncComponent(() => import("../../posts/PostComponent.vue"));

const props = defineProps<{
  user: User;
  meta?: MetaData;
}>();

let cursor: string | undefined;
let hasMore = true;

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
  try {
    const toAdd: PostWithSystem[] = [];
    let usedApi = false;

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
            } as PostWithSystem)
        );
        nextItems.value.push(...loadedPosts);
        usedApi = true;
      }
    }

    toAdd.push(...nextItems.value.splice(0, 5));

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

    const _done = () => done(!(hasMore || nextItems.value.length > 0));

    if (usedApi) {
      setTimeout(() => {
        _done();
      }, 100);
    } else {
      _done();
    }
  } catch (e) {
    done(true);
    throw e;
  }
}

function handleDeletePost(postId: string) {
  items.value = items.value.filter((post) => post.post_id !== postId);
}
</script>
