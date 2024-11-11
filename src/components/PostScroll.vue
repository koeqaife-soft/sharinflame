<template>
  <q-pull-to-refresh @refresh="reloadPosts" class="pull-to-refresh">
    <q-scroll-area class="scroll-area" :visible="false">
      <q-infinite-scroll @load="onLoad" class="posts-infinite-scroll" :key="scrollKey">
        <div v-for="(item, index) in items" :key="index" class="post-div">
          <PostComponent :post="item" class="q-mb-sm animation-fade-in-down" />
        </div>
        <template v-slot:loading v-if="!pullToRefreshDone || items.length > 0">
          <div class="row justify-center q-my-md">
            <q-spinner class="loading" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>
    </q-scroll-area>
  </q-pull-to-refresh>
</template>
<script setup lang="ts">
import { ref, watch, defineAsyncComponent } from "vue";
import { usePostsStore } from "src/stores/posts-store";
import { KeyOfGetPostsTypes, viewPosts } from "src/api/posts";
import { isAxiosError } from "axios";

const PostComponent = defineAsyncComponent(() => import("./PostComponent.vue"));

const props = defineProps<{
  type: KeyOfGetPostsTypes;
}>();

const items = ref<Post[]>([]);
const scrollKey = ref<string>(props.type);
const store = usePostsStore();
const pullToRefreshDone = ref<(() => void) | undefined>(undefined);

watch(() => props.type, onTypeChange);

function onTypeChange() {
  items.value = [];
  store.reset();
  scrollKey.value = `${props.type}-${Date.now()}`;
}

function reloadPosts(done: () => void) {
  items.value = [];
  store.reset();
  scrollKey.value = `${props.type}-${Date.now()}`;
  pullToRefreshDone.value = () => {
    done();
    pullToRefreshDone.value = undefined;
  };
}

async function onLoad(index: number, done: (stop?: boolean) => void) {
  const toLoad = items.value.length == 0 ? 10 : 5;
  try {
    if (store.loaded.length == 0 && store.notLoaded.length == 0) {
      const r = await store.getPosts(props.type);
      if (!r.success) return;
    }
    if (store.loaded.length == 0) {
      await store.loadPosts(toLoad);
    }
    if (store.loaded.length != 0) {
      const posts = store.viewPosts(toLoad);

      items.value.push(...posts);

      const postIds = posts.map((post) => String(post.post_id));
      viewPosts(postIds);
    }
    done();
  } catch (e) {
    if (isAxiosError(e)) done(true);
    else throw e;
  } finally {
    if (pullToRefreshDone.value) setTimeout(pullToRefreshDone.value, 250);
  }
}
</script>
