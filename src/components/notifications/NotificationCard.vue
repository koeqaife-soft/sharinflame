<template>
  <div class="card notification" :class="{ loading, disabled }" @click="onClicked">
    <div class="image-container">
      <open-user-dialog
        v-if="notif.linked_type == 'post' || notif.linked_type == 'comment'"
        :user="notif.loaded.user"
      />
      <q-icon :name="typeIcons[notif.type] ?? ''" class="icon" />
    </div>
    <div class="text-container">
      <div class="title">{{ $t(`notifications.${notif.type}`, { username }) }}</div>
      <div class="message">{{ message }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { isAxiosError } from "axios";
import { useQuasar } from "quasar";
import { getComment, getPost } from "src/api/posts";
import { computed, defineAsyncComponent, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const quasar = useQuasar();
const PostDialog = defineAsyncComponent(() => import("src/components/dialogs/PostDialog.vue"));
const OpenUserDialog = defineAsyncComponent(() => import("../dialogs/OpenUserDialog.vue"));

const loading = ref(false);
const disabled = ref(false);

const typeIcons = {
  new_comment: "sym_r_chat_bubble",
  followed: "sym_r_person_add"
};

const username = computed(() => {
  if (!props.notif.loaded) return undefined;
  else {
    switch (props.notif.linked_type) {
      case "post":
        return props.notif.loaded.user.username;
      case "comment":
        return props.notif.loaded.user.username;
      default:
        return undefined;
    }
  }
});
const message = computed(() => {
  if (!props.notif.loaded) return props.notif.message;
  else {
    switch (props.notif.linked_type) {
      case "post":
        return props.notif.loaded.content;
      case "comment":
        return props.notif.loaded.content;
      default:
        return undefined;
    }
  }
});

async function onClicked() {
  if (disabled.value || loading.value) return;

  loading.value = true;
  if (props.notif.linked_type == "post") {
    // Sync post just in case
    const post = await getPost(props.notif.loaded.post_id);
    if (post.data.success) {
      quasar.dialog({
        component: PostDialog,
        componentProps: {
          post: post.data.data
        }
      });
    }
  } else if (props.notif.linked_type == "comment") {
    // Sync post and comment just in case
    try {
      const [post, comment] = await Promise.all([
        getPost(props.notif.loaded.post_id),
        getComment(props.notif.loaded.post_id, props.notif.loaded.comment_id)
      ]);
      if (post.data.success && comment.data.success) {
        quasar.dialog({
          component: PostDialog,
          componentProps: {
            post: post.data.data,
            firstComment: comment.data.data,
            autoLoad: false
          }
        });
      }
    } catch (e) {
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
      disabled.value = true;
    }
  }
  loading.value = false;
}

const props = defineProps<{
  notif: ApiNotification;
}>();
</script>
