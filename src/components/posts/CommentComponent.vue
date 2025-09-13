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
      <div class="action-container">
        <my-button
          icon="reply"
          :label="formatNumber(commentRef.replies_count)"
          class="comments round button"
          size="sm"
          @click="repliesDialog"
          :disable="disable"
        />
      </div>
      <q-space />
      <div class="action-container circle">
        <my-button icon="more_horiz" class="more button circle" size="sm" :disable="disable" :loading="moreMenuLoading">
          <q-menu class="comment-more-menu" self="top right" v-if="!moreMenuLoading">
            <more-menu :comment="commentRef" @action="action" :show-go-to="!hideGoTo && !(inDialog ?? true)" />
          </q-menu>
        </my-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onUnmounted, ref, toRef } from "vue";
import { formatStringForHtml, formatNumber } from "src/utils/format";
import TextParts from "../misc/TextParts.vue";
import ReactionButtons from "./ReactionButtons.vue";
import MyButton from "../my/MyButton.vue";
import { i18n } from "src/boot/i18n";
import { useQuasar } from "quasar";
import { deleteComment, getComment, getPost } from "src/api/posts";
import { isAxiosError } from "axios";
import { useMainStore } from "src/stores/main-store";

const OpenUserDialog = defineAsyncComponent(() => import("../profile/OpenUserDialog.vue"));
const MoreMenu = defineAsyncComponent(() => import("./CommentMoreMenu.vue"));

let controller: AbortController | null = null;

const emit = defineEmits<{
  (e: "deleteComment", comment_id: string): void;
}>();

const props = defineProps<{
  comment: CommentWithUser;
  hideGoTo?: boolean;
  inDialog?: boolean;
  inRepliesDialog?: boolean;
}>();

const canAnimate = ref(false);
const commentRef = toRef(props.comment);
const disable = ref(false);
const moreMenuLoading = ref(false);

const quasar = useQuasar();
const mainStore = useMainStore();

function allowAnimate() {
  canAnimate.value = true;
}

async function onCommentDelete() {
  const { t } = i18n.global;
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
}

async function action(type: string, data: unknown) {
  const { t } = i18n.global;

  switch (type) {
    case "delete":
      mainStore.openDialog(
        "okCancel",
        "",
        {
          localeKey: "delete_comment_dialog",
          okKey: "delete",
          okType: "attention",
          okIcon: "delete_forever"
        },
        () => void onCommentDelete()
      );
      break;
    case "go_to_post": {
      moreMenuLoading.value = true;
      try {
        if (!controller) controller = new AbortController();
        const post = await getPost(props.comment.post_id, { signal: controller.signal });
        if (post.data.success) {
          mainStore.openDialog("post", post.data.data.post_id, {
            post: post.data.data,
            autoLoad: false,
            ...(!commentRef.value.parent_comment_id && { firstComment: props.comment })
          });
        }
        moreMenuLoading.value = false;
      } catch (e) {
        if (isAxiosError(e) && e.code == "ERR_CANCELED") return;
        if (isAxiosError(e) && e.response?.status == 404) {
          quasar.notify({
            type: "error-notification",
            message: t("resource_not_found")
          });
        } else {
          quasar.notify({
            type: "error-notification",
            message: t("an_error_occurred")
          });
        }
      }

      break;
    }
    case "jump_to_replied":
      moreMenuLoading.value = true;
      try {
        if (!controller) controller = new AbortController();
        const comment = await getComment(props.comment.post_id, props.comment.parent_comment_id!, {
          signal: controller.signal
        });
        if (comment.data.success) {
          mainStore.openDialog("replies", comment.data.data.comment_id, {
            comment: comment.data.data,
            firstComment: commentRef.value,
            autoLoad: false,
            inDialog: props.inDialog
          });
        }
        moreMenuLoading.value = false;
      } catch (e) {
        if (isAxiosError(e) && e.code == "ERR_CANCELED") return;
        if (isAxiosError(e) && e.response?.status == 404) {
          quasar.notify({
            type: "error-notification",
            message: t("resource_not_found")
          });
        } else {
          quasar.notify({
            type: "error-notification",
            message: t("an_error_occurred")
          });
        }
      }
      break;
    case "report":
      mainStore.openDialog("report", "", { targetType: "comment", targetId: commentRef.value.post_id });
      break;
    case "copy_id":
      void navigator.clipboard.writeText(data as string);
      break;
  }
}

function repliesDialog() {
  if (props.inRepliesDialog) return;
  mainStore.openDialog("replies", commentRef.value.comment_id, {
    comment: commentRef.value,
    onDelete: () => {
      disable.value = true;
      emit("deleteComment", commentRef.value.comment_id);
    },
    inDialog: props.inDialog
  });
}

onUnmounted(() => {
  if (controller) controller.abort();
});
</script>
