<template>
  <div class="container full-height">
    <div class="horizontal-container">
      <my-button
        type="card"
        :is-category="true"
        class="full-width"
        :class="{ selected: selected == category }"
        @click="select(category)"
        v-for="category in categories"
        :key="category"
        :label="$t(category)"
        :icon="icons[category]"
        style="z-index: 2"
      />
    </div>
    <transition name="crossfade" mode="out-in">
      <keep-alive>
        <q-scroll-area class="scroll-area full-height fix-scroll-area" :visible="false" v-if="selected == 'posts'">
          <my-virtual-scroll
            :items="items[0]"
            item-key="post_id"
            infinite-load-type="bottom"
            :margins="8"
            @load-more="(i: number, done: DoneType) => onLoadData(0, 'posts', done)"
            ref="virtualScroll"
          >
            <template v-slot:default="{ item, index }">
              <post-component
                :post="item"
                :class="{ 'q-mb-sm': index + 1 < items[0].length }"
                @delete-post="handleDeletePost"
              />
            </template>
            <template v-slot:loading>
              <div class="row justify-center q-my-md">
                <q-spinner class="loading full-height q-my-md" size="40px" />
              </div>
            </template>
          </my-virtual-scroll>
        </q-scroll-area>
        <q-scroll-area
          class="scroll-area full-height fix-scroll-area"
          :visible="false"
          v-else-if="selected == 'comments'"
        >
          <my-virtual-scroll
            :items="items[1]"
            item-key="comment_id"
            infinite-load-type="bottom"
            :margins="8"
            @load-more="(i: number, done: DoneType) => onLoadData(1, 'comments', done)"
          >
            <template v-slot:default="{ item, index }">
              <comment-component :comment="item" :class="{ 'q-mb-sm': index + 1 < items[1].length }" />
            </template>
            <template v-slot:loading>
              <div class="row justify-center q-my-md">
                <q-spinner class="loading full-height q-my-md" size="40px" />
              </div>
            </template>
          </my-virtual-scroll>
        </q-scroll-area>
      </keep-alive>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, type DefineComponent, nextTick, ref } from "vue";
import MyVirtualScroll from "src/components/my/MyVirtualScroll.vue";
import MyButton from "src/components/my/MyButton.vue";
import { getFavorites, getReactions } from "src/api/users";

const PostComponent = defineAsyncComponent(() => import("../posts/PostComponent.vue"));
const CommentComponent = defineAsyncComponent(() => import("../posts/CommentComponent.vue"));

type DoneType = (stop?: boolean) => void;

const props = defineProps<{
  type: "favorites" | "liked" | "disliked";
}>();

const categories = ["posts", "comments"] as const;
type Category = (typeof categories)[number];

const icons = {
  posts: "article",
  comments: "chat_bubble"
} as const;

const selected = ref<Category>("posts");

const items = ref<[Post[], CommentWithUser[]]>([[], []]);
const cursor: [string | undefined, string | undefined] = [undefined, undefined];

const virtualScroll = ref<DefineComponent | null>(null);

function select(value: Category) {
  selected.value = value;
}

async function onLoadData(index: number, category: Category, done: DoneType) {
  try {
    let r: Awaited<ReturnType<typeof getFavorites | typeof getReactions>>;
    if (props.type == "favorites") {
      r = await getFavorites(category, cursor[index]);
    } else {
      r = await getReactions(props.type == "liked", category, cursor[index]);
    }
    if (r.data.success && r.data.data[category]) {
      cursor[index] = r.data.data.next_cursor;
      if (category === "posts") {
        items.value[0].push(...r.data.data[category]);
      } else {
        items.value[1].push(...r.data.data[category]);
      }
      done(!r.data.data.has_more);
    } else {
      done(true);
    }
  } catch {
    done(true);
  }
}

function handleDeletePost(postId: string) {
  items.value[0] = items.value[0].filter((post) => post.post_id !== postId);
  void nextTick(() => virtualScroll.value?.updateShowedItems());
}
</script>
