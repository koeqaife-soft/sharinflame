<template>
  <my-button
    type="card"
    class="notification"
    :class="{ unread: props.notif.unread }"
    :loading="loading"
    :disable="disabled || isUnavailable"
    tabindex="0"
    ref="elementRef"
    @click="onClicked"
  >
    <div class="image-container">
      <open-user-dialog
        v-if="notif.linked_type == 'post' || notif.linked_type == 'comment'"
        :user="notif.loaded.user"
      />
      <my-icon :icon="typeIcons[actualType] ?? ''" class="icon" />
    </div>
    <div class="text-container" @click="onClicked">
      <div class="title">{{ $t(`notifications.${actualType}`, { username: linkedContent.username }) }}</div>
      <div class="message" v-if="linkedContent.message" v-html="formatStringForHtml(linkedContent.message)" />
    </div>
  </my-button>
</template>
<script setup lang="ts">
import { isAxiosError } from "axios";
import { useQuasar } from "quasar";
import { getComment, getPost } from "src/api/posts";
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, toRef } from "vue";
import { useI18n } from "vue-i18n";
import MyIcon from "src/components/my/MyIcon.vue";
import MyButton from "src/components/my/MyButton.vue";
import { readNotification } from "src/api/users";
import { useMainStore } from "src/stores/main-store";
import { formatStringForHtml } from "src/utils/format";

const { t } = useI18n();
const quasar = useQuasar();
const mainStore = useMainStore();
const OpenUserDialog = defineAsyncComponent(() => import("../profile/OpenUserDialog.vue"));

let controller: AbortController | null = null;

const actualType = computed(() => {
  if (props.notif.type == "new_comment") {
    if ((props.notif.loaded as CommentWithUser)?.parent_comment_id) return "new_reply";
  }
  return props.notif.type;
});

interface Entry {
  lastSync: number;
  data: unknown;
}

export interface CacheType {
  disabled?: boolean;
  [key: string]: Entry | boolean;
}

const props = defineProps<{
  notif: ApiNotification;
  cache?: Record<string, CacheType>;
}>();
const emit = defineEmits<{
  (e: "onLoaded"): void;
}>();

const globalCache = toRef(props.cache);
const localCache: CacheType = {};

const elementRef = ref<HTMLDivElement | null>(null);
const loading = ref(false);
const disabled = ref(false);

const typeIcons = {
  new_comment: "chat_bubble",
  new_reply: "reply",
  followed: "person_add"
};

function setCache(key: string, value: CacheType[string]) {
  if (globalCache.value) globalCache.value[props.notif.id]![key] = value;
  else localCache[key] = value;
}

function getCache(key: string) {
  if (globalCache.value) return globalCache.value[props.notif.id]![key];
  else return localCache[key];
}

const linkedContent = computed(() => {
  if (!props.notif.loaded) {
    return { username: undefined, message: props.notif.message };
  }
  if (props.notif.linked_type === "post" || props.notif.linked_type === "comment") {
    let message;
    if (!props.notif.loaded.content) message = t("resource_not_found");
    else message = props.notif.loaded.content;

    return {
      username: props.notif.loaded.user.username,
      message: message
    };
  }
  return { username: undefined, message: undefined };
});

const isUnavailable = computed(() => {
  if (!props.notif.loaded) {
    return false;
  }
  if (props.notif.linked_type === "post" || props.notif.linked_type === "comment") {
    if (!props.notif.loaded.content) return true;
  }
  return false;
});

async function sync<T>(callback: () => Promise<T>, key: string): Promise<T> {
  try {
    loading.value = true;
    const cached = getCache(key) as Entry;

    if (cached === undefined || cached.lastSync + 120 > Date.now() * 1000) {
      const result = await callback();
      setCache(key, {
        lastSync: Date.now() * 1000,
        data: result
      });
      return result;
    } else {
      return cached.data as T;
    }
  } finally {
    loading.value = false;
  }
}

async function onClicked() {
  if (disabled.value || loading.value) return;
  if (!controller) controller = new AbortController();

  if (props.notif.unread) {
    void readNotification(props.notif.id);
    toRef(props.notif).value.unread = false;
  }

  try {
    if (props.notif.linked_type == "post") {
      const post = await sync(() => getPost(props.notif.loaded!.post_id, { signal: controller!.signal }), "post");
      if (post.data.success) {
        mainStore.openDialog("post", post.data.data.post_id, { post: post.data.data });
      }
    } else if (props.notif.linked_type == "comment") {
      if (props.notif.loaded.parent_comment_id) {
        const [parent, comment] = await sync(
          () =>
            Promise.all([
              getComment(props.notif.loaded!.post_id, (props.notif.loaded as CommentWithUser).parent_comment_id!, {
                signal: controller!.signal
              }),
              getComment(props.notif.loaded!.post_id, (props.notif.loaded as CommentWithUser).comment_id, {
                signal: controller!.signal
              })
            ]),
          "reply"
        );
        if (comment.data.success && parent.data.success) {
          mainStore.openDialog("replies", parent.data.data.comment_id, {
            comment: parent.data.data,
            inDialog: false,
            firstComment: comment.data.data,
            autoLoad: false
          });
          emit("onLoaded");
        }
      } else {
        const [post, comment] = await sync(
          () =>
            Promise.all([
              getPost(props.notif.loaded!.post_id, { signal: controller!.signal }),
              getComment(props.notif.loaded!.post_id, (props.notif.loaded as CommentWithUser).comment_id, {
                signal: controller!.signal
              })
            ]),
          "post+comment"
        );
        if (post.data.success && comment.data.success) {
          mainStore.openDialog("post", post.data.data.post_id, {
            post: post.data.data,
            firstComment: comment.data.data,
            autoLoad: false
          });
          emit("onLoaded");
        }
      }
    }
  } catch (e) {
    disabled.value = true;
    setCache("disabled", true);
    if (isAxiosError(e) && e.code == "ERR_CANCELED") {
      return;
    } else if (isAxiosError(e) && e.response?.status == 404) {
      quasar.notify({
        type: "error-notification",
        message: t("resource_not_found")
      });
    } else {
      quasar.notify({
        type: "error-notification",
        message: t("an_error_occurred")
      });
      throw e;
    }
  }
}

onMounted(() => {
  if (globalCache.value) {
    globalCache.value[props.notif.id] ??= {};
    disabled.value = (getCache("disabled") as boolean) ?? false;
  }
});

onUnmounted(() => {
  controller?.abort();
});
</script>
