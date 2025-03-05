<template>
  <q-card class="comment card" unelevated :key="commentRef.comment_id">
    <q-card-section class="q-pb-none">
      <div class="avatar-container">
        <open-user-dialog :user="commentRef.user" />
      </div>
      <div class="text-container">
        <div class="username">
          {{ commentRef.user.display_name || commentRef.user.username }}
        </div>
        <text-parts :text="formatStringForHtml(commentRef.content)" :html="true" />
      </div>
    </q-card-section>
    <q-card-actions class="actions" :class="{ 'can-animate': canAnimate }">
      <div class="reaction-buttons">
        <reaction-buttons :object="commentRef" :before-action="allowAnimate" :is-comment="true" />
      </div>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, toRef } from "vue";
import { formatStringForHtml } from "src/utils/format";
import TextParts from "../misc/TextParts.vue";

const OpenUserDialog = defineAsyncComponent(() => import("../dialogs/OpenUserDialog.vue"));
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
