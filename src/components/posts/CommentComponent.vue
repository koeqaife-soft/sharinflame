<template>
  <div class="card comment" :key="commentRef.comment_id">
    <div class="card-section content-section">
      <div class="avatar-container">
        <open-user-dialog :user="commentRef.user" />
      </div>
      <div class="text-container">
        <div class="username">
          {{ commentRef.user.display_name || commentRef.user.username }}
        </div>
        <text-parts class="content" :text="formatStringForHtml(commentRef.content)" :html="true" />
      </div>
    </div>
    <div class="actions card-section actions-section" :class="{ 'can-animate': canAnimate }">
      <div class="reaction-buttons">
        <reaction-buttons :object="commentRef" :before-action="allowAnimate" :is-comment="true" :disable="disable" />
      </div>
      <q-space />
      <div class="action-container circle">
        <q-btn unelevated icon="sym_r_more_horiz" class="more button circle" size="sm" :disable="disable">
          <q-menu class="comment-more-menu" self="top right">
            <more-menu :comment="commentRef" @action="action" />
          </q-menu>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, toRef } from "vue";
import { formatStringForHtml } from "src/utils/format";
import TextParts from "../misc/TextParts.vue";
import { i18n } from "src/boot/i18n";
import { useQuasar } from "quasar";
import { deleteComment } from "src/api/posts";

const OpenUserDialog = defineAsyncComponent(() => import("../dialogs/OpenUserDialog.vue"));
const ReactionButtons = defineAsyncComponent(() => import("./ReactionButtons.vue"));
const MoreMenu = defineAsyncComponent(() => import("./CommentMoreMenu.vue"));

const emit = defineEmits<{
  (e: "deleteComment", comment_id: string): void;
}>();

const props = defineProps<{
  comment: CommentWithUser;
}>();

const canAnimate = ref(false);
const commentRef = toRef(props.comment);
const disable = ref(false);

const quasar = useQuasar();

function allowAnimate() {
  canAnimate.value = true;
}

async function action(type: string, data: unknown) {
  const { t } = i18n.global;

  switch (type) {
    case "delete":
      try {
        await deleteComment(commentRef.value.post_id, commentRef.value.comment_id);
        quasar.notify({
          type: "default-notification",
          progress: true,
          icon: "sym_r_delete_forever",
          message: t("comment_deleted.msg"),
          caption: t("comment_deleted.caption")
        });
        emit("deleteComment", commentRef.value.comment_id);
        disable.value = true;
      } catch (e) {
        quasar.notify({
          type: "error-notification",
          progress: true,
          message: t("comment_deleted.failed")
        });
        throw e;
      }

      break;
    case "copy_id":
      void navigator.clipboard.writeText(data as string);
      break;
  }
}
</script>
