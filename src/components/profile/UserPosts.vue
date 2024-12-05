<template>
  <q-scroll-area class="scroll-area full-height" :visible="false">
    <div class="sticky-label">
      <q-card class="card q-mb-sm label-container">
        <div class="horizontal-container">
          <q-icon name="sym_r_sort" class="icon" />
          <q-select
            class="select"
            v-model="sort"
            :options="sortOptions"
            :option-label="(opt) => $t(`sort_${opt}`)"
            dense
            borderless
            style="min-width: 100px; width: 150px; max-width: 300px"
            @update:model-value="reloadPosts"
          />
          <q-space />
          <q-btn flat round icon="sym_r_refresh" size="xs" @click="reloadPosts" />
        </div>
      </q-card>
    </div>
    <q-infinite-scroll @load="onLoad" class="posts-infinite-scroll" :key="scrollKey">
      <div v-for="(item, index) in items" :key="index" class="post-div">
        <post-component :post="item" class="q-mb-sm animation-fade-in-down" />
      </div>
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

const PostComponent = defineAsyncComponent(() => import("../posts/PostComponent.vue"));

const props = defineProps<{
  user: User;
  meta?: MetaData;
}>();

let cursor: string | undefined;

const items = ref<PostWithSystem[]>([]);
const scrollKey = ref(Date.now());
const sortOptions = ["old", "new", "popular"] as const;
const sort = ref<(typeof sortOptions)[number]>("new");

function reloadPosts() {
  items.value = [];
  cursor = undefined;
  scrollKey.value = Date.now();
}

async function onLoad(index: number, done: (stop?: boolean) => void) {
  try {
    const r = await getUserPosts(props.user.user_id, cursor, sort.value);
    if (r.data.success) {
      const posts = r.data.data.posts.map(
        (post) =>
          ({
            ...post,
            user: props.user
          } as PostWithSystem)
      );
      items.value.push(...posts);
      cursor = r.data.data.next_cursor;
      done(!r.data.data.has_more);
    }
  } catch (e) {
    done(true);
    throw e;
  }
}
</script>
