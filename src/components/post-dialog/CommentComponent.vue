<template>
  <q-card class="comment card" unelevated :key="commentRef.comment_id">
    <q-card-section class="q-pb-none">
      <user-avatar :user="commentRef.user" />
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
        />
        <q-separator vertical class="separator" />
        <q-btn
          unelevated
          icon="sym_r_thumb_down"
          :label="formatNumber(commentRef.dislikes_count)"
          :class="['dislike round-right button', { active: commentRef.is_like === false }]"
          size="sm"
        />
      </div>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import UserAvatar from "../UserAvatar.vue";
import { formatNumber, formatStringForHtml } from "src/utils/format";

const props = defineProps<{
  comment: CommentWithUser;
}>();

const commentRef = ref(props.comment);
</script>
