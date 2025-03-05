<template>
  <div class="action-container">
    <q-btn
      unelevated
      icon="sym_r_thumb_up"
      :label="formatNumber(objectRef.likes_count)"
      :class="['like round-left button', { active: objectRef.is_like === true }]"
      size="sm"
      @click="like"
    />
    <q-separator vertical class="separator" />
    <q-btn
      unelevated
      icon="sym_r_thumb_down"
      :label="formatNumber(objectRef.dislikes_count)"
      :class="['dislike round-right button', { active: objectRef.is_like === false }]"
      size="sm"
      @click="dislike"
    />
  </div>
  <div class="action-container circle">
    <q-btn
      unelevated
      icon="sym_r_favorite"
      :class="['comments button circle', { active: objectRef.is_fav }]"
      size="sm"
      @click="favoriteButton"
    />
  </div>
</template>
<script setup lang="ts">
import { useReaction } from "src/composables/useReaction";
import { toRef } from "vue";
import { formatNumber } from "src/utils/format";

const props = defineProps<{
  object: Post | Comment;
  beforeAction?: () => void;
}>();

const objectRef = toRef(props.object);

const { like, dislike, favoriteButton } = useReaction(objectRef, true, props.beforeAction);
</script>
