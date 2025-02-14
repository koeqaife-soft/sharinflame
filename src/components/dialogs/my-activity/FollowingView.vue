<template>
  <div class="container full-height">
    <q-scroll-area class="scroll-area full-height fix-scroll-area" :visible="false">
      <my-virtual-scroll
        :items="items"
        item-key="user_id"
        infinite-load-type="bottom"
        :margins="8"
        @load-more="loadMore"
        ref="virtualScroll"
        :min-item-height="58"
      >
        <template v-slot:default="{ item }">
          <user-card :user="item" class="q-mb-sm" />
        </template>
        <template v-slot:loading>
          <div class="row justify-center q-my-md">
            <q-spinner class="loading full-height q-my-md" size="40px" />
          </div>
        </template>
      </my-virtual-scroll>
    </q-scroll-area>
  </div>
</template>
<script setup lang="ts">
import { getFollowing } from "src/api/users";
import MyVirtualScroll from "src/components/misc/MyVirtualScroll.vue";
import { defineAsyncComponent, DefineComponent, ref } from "vue";

const UserCard = defineAsyncComponent(() => import("../../profile/UserCard.vue"));

const items = ref<User[]>([]);
const virtualScroll = ref<DefineComponent | null>(null);
let nextCursor: string | undefined = undefined;

async function loadMore(index: number, done: (stop?: boolean) => void) {
  try {
    const followed = await getFollowing(nextCursor);
    if (followed.data.success) {
      const data = followed.data.data;

      nextCursor = data.next_cursor;

      items.value.push(...data.following);
      done(!data.has_more);
    } else {
      done(true);
    }
  } catch {
    done(true);
  }
}
</script>
