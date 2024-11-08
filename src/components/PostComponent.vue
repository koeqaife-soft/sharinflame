<template>
  <q-card class="post card" unelevated :key="postRef.post_id">
    <q-card-section class="q-pb-none">
      <user-avatar :user="postRef.user" />
      <div class="text-container">
        <div class="username">{{ postRef.user.display_name || postRef.user.username }}</div>
        <div class="content wrap-text">{{ postRef.content }}</div>
      </div>
    </q-card-section>
    <q-card-actions class="actions">
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
        />
      </div>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import UserAvatar from "./UserAvatar.vue";
import { remReaction, setReaction } from "src/api/posts";
import { formatNumber } from "src/utils/format";

const props = defineProps<{
  post: Post;
}>();

const postRef = ref<Post>(props.post);
let debounceTimeout: NodeJS.Timeout | null = null;
const clickCount = ref(0);

function debounceAction(callback: () => void, delay: number) {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(callback, delay);
}

function like() {
  if (clickCount.value <= 5) {
    clickCount.value += 1;
    performLike();
  } else {
    debounceAction(performLike, 250);
  }
}

function dislike() {
  if (clickCount.value <= 5) {
    clickCount.value += 1;
    performDislike();
  } else {
    debounceAction(performDislike, 250);
  }
}

async function performLike() {
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
</script>
