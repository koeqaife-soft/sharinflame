<template>
  <q-card class="post card" unelevated :key="postRef.post_id">
    <q-card-section class="q-pb-none">
      <user-avatar :user="postRef.user" v-if="!postRef.is_system" />
      <div class="text-container">
        <div class="username">
          {{ postRef.is_system ? $t("system") : postRef.user.display_name || postRef.user.username }}
        </div>
        <div class="content wrap-text" v-html="formatStringForHtml(postRef.content)" />
      </div>
    </q-card-section>
    <q-card-actions class="actions" v-if="!postRef.is_system">
      <div class="action-container">
        <q-btn
          unelevated
          icon="sym_r_thumb_up"
          :label="formatNumber(postRef.likes_count)"
          :class="['like round-left button', { active: postRef.is_like === true }]"
          size="sm"
          @click="like"
        />
        <q-separator vertical class="separator" />
        <q-btn
          unelevated
          icon="sym_r_thumb_down"
          :label="formatNumber(postRef.dislikes_count)"
          :class="['dislike round-right button', { active: postRef.is_like === false }]"
          size="sm"
          @click="dislike"
        />
      </div>
      <div class="action-container">
        <q-btn
          unelevated
          icon="sym_r_chat_bubble"
          :label="formatNumber(postRef.comments_count)"
          class="comments round button"
          size="sm"
          @click="postDialog"
        />
      </div>
    </q-card-actions>
    <q-card-actions class="actions" v-else-if="postRef.actions">
      <div class="action-container" v-for="action in postRef.actions" :key="action.name">
        <q-btn
          unelevated
          no-caps
          :icon="action.icon"
          :label="$t(action.name)"
          class="round button"
          size="sm"
          @click="action.func()"
        />
      </div>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";
import UserAvatar from "./UserAvatar.vue";
import { remReaction, setReaction } from "src/api/posts";
import { formatNumber, formatStringForHtml } from "src/utils/format";
import { useQuasar } from "quasar";

const PostDialog = defineAsyncComponent(() => import("./post-dialog/PostDialog.vue"));
const quasar = useQuasar();

const props = defineProps<{
  post: PostWithSystem;
  inDialog?: boolean;
}>();

const postRef = ref<PostWithSystem>(props.post);

let debounceTimeout: NodeJS.Timeout | null = null;

function updateMeta(key: string, value: number) {
  postRef.value._meta = postRef.value._meta || {};
  postRef.value._meta[key] = value;
}

function getMeta(key: string, defaultValue: number = 0): number {
  return (postRef.value._meta?.[key] ?? defaultValue) as number;
}

function debounce(callback: () => void, delay: number) {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(callback, delay);
}

function handleReaction(action: () => Promise<void>) {
  const clickCount = getMeta("clickCount");
  if (clickCount <= 5) {
    updateMeta("clickCount", clickCount + 1);
    action();
  } else {
    debounce(action, 250);
  }
}

function like() {
  handleReaction(performLike);
}

function dislike() {
  handleReaction(performDislike);
}

async function performLike() {
  if (postRef.value.is_system) return;

  if (postRef.value.is_like === true) {
    await remReaction(postRef.value.post_id);

    postRef.value.is_like = undefined;
    postRef.value.likes_count -= 1;
  } else {
    await setReaction(postRef.value.post_id, true);

    if (postRef.value.is_like === false) postRef.value.dislikes_count -= 1;
    postRef.value.likes_count += 1;

    postRef.value.is_like = true;
  }
}

async function performDislike() {
  if (postRef.value.is_system) return;

  if (postRef.value.is_like === false) {
    await remReaction(postRef.value.post_id);

    postRef.value.is_like = undefined;
    postRef.value.dislikes_count -= 1;
  } else {
    await setReaction(postRef.value.post_id, false);

    if (postRef.value.is_like === true) postRef.value.likes_count -= 1;
    postRef.value.dislikes_count += 1;

    postRef.value.is_like = false;
  }
}

function postDialog() {
  if (props.inDialog) return;
  quasar.dialog({
    component: PostDialog,
    componentProps: {
      post: postRef.value
    }
  });
}
</script>
