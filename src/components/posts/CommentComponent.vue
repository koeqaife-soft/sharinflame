<template>
  <q-card class="comment card" unelevated :key="commentRef.comment_id">
    <q-card-section class="q-pb-none">
      <open-user-dialog :user="commentRef.user" />
      <div class="text-container">
        <div class="username">
          {{ commentRef.user.display_name || commentRef.user.username }}
        </div>
        <div class="content wrap-text" v-html="formatStringForHtml(commentRef.content)" />
      </div>
    </q-card-section>
    <q-card-actions class="actions">
      <div class="action-container">
        <q-btn
          unelevated
          icon="sym_r_thumb_up"
          :label="formatNumber(commentRef.likes_count)"
          :class="['like round-left button', { active: commentRef.is_like === true }]"
          size="sm"
          @click="like"
        />
        <q-separator vertical class="separator" />
        <q-btn
          unelevated
          icon="sym_r_thumb_down"
          :label="formatNumber(commentRef.dislikes_count)"
          :class="['dislike round-right button', { active: commentRef.is_like === false }]"
          size="sm"
          @click="dislike"
        />
      </div>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import OpenUserDialog from "../dialogs/OpenUserDialog.vue";
import { formatNumber, formatStringForHtml } from "src/utils/format";
import { remReaction, setReaction } from "src/api/posts";
import { useQuasar } from "quasar";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  comment: CommentWithUser;
}>();

const quasar = useQuasar();
const { t } = useI18n();

const commentRef = ref(props.comment);
let debounceTimeout: NodeJS.Timeout | null = null;

let lastReaction = commentRef.value.is_like;
let lastCounters = [commentRef.value.likes_count, commentRef.value.dislikes_count];
let blockLastReaction = false;

function debounce(callback: () => void, delay: number) {
  if (debounceTimeout !== null) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(callback, delay);
}

function changeLastReaction(reaction: boolean | undefined, counters: typeof lastCounters) {
  if (blockLastReaction) return;
  lastReaction = reaction;
  lastCounters = counters;
}

function handleReaction(isLike: boolean) {
  const { is_like, likes_count, dislikes_count } = commentRef.value;

  changeLastReaction(is_like, [likes_count, dislikes_count]);
  blockLastReaction = true;
  updateReactionCounters(isLike);

  debounce(() => performReaction(isLike), 500);
}

function updateReactionCounters(isLike: boolean) {
  if (commentRef.value.is_like === isLike) {
    commentRef.value.is_like = undefined;
    isLike ? commentRef.value.likes_count-- : commentRef.value.dislikes_count--;
  } else {
    if (commentRef.value.is_like !== undefined) {
      isLike ? commentRef.value.dislikes_count-- : commentRef.value.likes_count--;
    }
    isLike ? commentRef.value.likes_count++ : commentRef.value.dislikes_count++;
    commentRef.value.is_like = isLike;
  }
}

function backReactionCounters() {
  if (commentRef.value.is_like === lastReaction) return;

  commentRef.value.is_like = lastReaction;
  commentRef.value.likes_count = lastCounters[0];
  commentRef.value.dislikes_count = lastCounters[1];
}

async function performReaction(isLike: boolean) {
  try {
    if (commentRef.value.is_like === lastReaction) return;
    if (commentRef.value.is_like === undefined) {
      await remReaction(commentRef.value.post_id, commentRef.value.comment_id);
    } else {
      await setReaction(commentRef.value.post_id, { isLike, commentId: commentRef.value.comment_id });
    }
  } catch (error) {
    backReactionCounters();
    quasar.notify({
      type: "error-notification",
      message: t("reaction_failed"),
      progress: true
    });
    console.error(error);
  } finally {
    blockLastReaction = false;
  }
}

function like() {
  handleReaction(true);
}

function dislike() {
  handleReaction(false);
}
</script>
