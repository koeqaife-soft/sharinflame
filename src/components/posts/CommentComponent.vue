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
      <div class="reaction-buttons">
        <reaction-buttons :object="commentRef" :before-action="allowAnimate" />
      </div>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, toRef } from "vue";
import OpenUserDialog from "../dialogs/OpenUserDialog.vue";
import { formatStringForHtml } from "src/utils/format";

const ReactionButtons = defineAsyncComponent(() => import("./ReactionButtons.vue"));

const props = defineProps<{
  comment: CommentWithUser;
}>();

const canAnimate = ref(false);
const commentRef = toRef(props.comment);

function allowAnimate() {
  canAnimate.value = true;
}
</script>
