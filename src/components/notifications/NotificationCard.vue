<template>
  <div class="card notification" :class="{ loading, disabled }">
    <div class="image-container">
      <open-user-dialog
        v-if="notif.linked_type == 'post' || notif.linked_type == 'comment'"
        :user="notif.loaded.user"
      />
      <q-icon :name="typeIcons[notif.type] ?? ''" class="icon" />
    </div>
    <div class="text-container" @click="onClicked">
      <div class="title">{{ $t(`notifications.${notif.type}`, { username: linkedContent.username }) }}</div>
      <div class="message">{{ linkedContent.message }}</div>
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

const props = defineProps<{
  notif: ApiNotification;
}>();

const cache: {
  [key: string]: {
    lastSync: number;
    data: unknown;
  };
} = {};

const loading = ref(false);
const disabled = ref(false);

const typeIcons = {
  new_comment: "sym_r_chat_bubble",
  followed: "sym_r_person_add"
};

const linkedContent = computed(() => {
  if (!props.notif.loaded) {
    return { username: undefined, message: props.notif.message };
  }
  if (props.notif.linked_type === "post" || props.notif.linked_type === "comment") {
    return {
      username: props.notif.loaded.user.username,
      message: props.notif.loaded.content
    };
  }
  return { username: undefined, message: undefined };
});

async function sync<T>(callback: () => Promise<T>, key: string): Promise<T> {
  try {
    loading.value = true;

    if (cache[key] === undefined || cache[key].lastSync + 120 > Date.now() * 1000) {
      const result = await callback();
      cache[key] = {
        lastSync: Date.now() * 1000,
        data: result
      };
      return result;
    } else {
      return cache[key].data as T;
    }
  } finally {
    loading.value = false;
  }
}

async function onClicked() {
  if (disabled.value || loading.value) return;
  try {
    if (props.notif.linked_type == "post") {
      const post = await sync(() => getPost(props.notif.loaded!.post_id), "post");
      if (post.data.success) {
        quasar.dialog({
          component: PostDialog,
          componentProps: {
            post: post.data.data
          }
        });
      }
    } else if (props.notif.linked_type == "comment") {
      const [post, comment] = await sync(
        () =>
          Promise.all([
            getPost(props.notif.loaded!.post_id),
            getComment(props.notif.loaded!.post_id, (props.notif.loaded as CommentWithUser).comment_id)
          ]),
        "post"
      );
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
</script>
