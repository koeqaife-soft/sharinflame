<template>
  <my-button
    type="card"
    class="notification"
    :loading="loading"
    :disable="disabled"
    tabindex="0"
    ref="elementRef"
    @click="onClicked"
  >
    <div class="image-container">
      <open-user-dialog
        v-if="notif.linked_type == 'post' || notif.linked_type == 'comment'"
        :user="notif.loaded.user"
      />
      <my-icon :icon="typeIcons[notif.type] ?? ''" class="icon" />
    </div>
    <div class="text-container" @click="onClicked">
      <div class="title">{{ $t(`notifications.${notif.type}`, { username: linkedContent.username }) }}</div>
      <div class="message">{{ linkedContent.message }}</div>
    </div>
  </my-button>
</template>
<script setup lang="ts">
import { isAxiosError } from "axios";
import { useQuasar } from "quasar";
import { getComment, getPost } from "src/api/posts";
import { computed, defineAsyncComponent, onMounted, ref, toRef } from "vue";
import { useI18n } from "vue-i18n";
import MyIcon from "src/components/my/MyIcon.vue";
import MyButton from "src/components/my/MyButton.vue";

const { t } = useI18n();
const quasar = useQuasar();
const PostDialog = defineAsyncComponent(() => import("src/components/posts/PostDialog.vue"));
const OpenUserDialog = defineAsyncComponent(() => import("../profile/OpenUserDialog.vue"));

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
        emit("onLoaded");
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
    setCache("disabled", true);
  }
}

onMounted(() => {
  if (globalCache.value) {
    globalCache.value[props.notif.id] ??= {};
    disabled.value = (getCache("disabled") as boolean) ?? false;
  }
});
</script>
