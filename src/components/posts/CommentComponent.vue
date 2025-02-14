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
    <q-card-actions class="actions" :class="{ 'can-animate': canAnimate }">
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
      <div class="action-container circle">
        <q-btn
          unelevated
          icon="sym_r_favorite"
          :class="['comments button circle', { active: commentRef.is_fav }]"
          size="sm"
          @click="favoriteButton"
        />
      </div>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import OpenUserDialog from "../dialogs/OpenUserDialog.vue";
import { formatNumber, formatStringForHtml } from "src/utils/format";
import { useReaction } from "src/composables/useReaction";

const props = defineProps<{
  comment: CommentWithUser;
}>();

const canAnimate = ref(false);

const commentRef = ref(props.comment);
const { like, dislike, favoriteButton } = useReaction(commentRef, true, allowAnimate);

function allowAnimate() {
  canAnimate.value = true;
}
</script>
