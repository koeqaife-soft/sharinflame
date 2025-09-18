<template>
  <q-dialog
    transition-show="slide-up"
    transition-hide="slide-down"
    class="notifications-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
  >
    <closeable-content v-on:hide="dialogRef!.hide()">
      <div class="dialog-header horizontal-container">
        <div class="horizontal-container label-container">
          <my-icon icon="notifications" class="header-icon" />
          <div class="label">{{ $t("notifications.label") }}</div>
        </div>
        <q-space />
        <my-button icon="close" @click="dialogRef?.hide()" />
      </div>
      <div class="dialog-content-inner">
        <q-scroll-area class="scroll-area fix-scroll-area full-height" :visible="false">
          <div class="unread-notifications card horizontal-container q-mb-sm">
            <span>
              <my-icon icon="visibility" />
              <span class="label">{{ $t("unread") }}: </span>
              <span class="count">{{ mainStore.getUnreadCount() }}</span>
            </span>
            <q-space />
            <my-button
              icon="mark_chat_read"
              :label="$t('read_all')"
              type="outlined"
              @click="() => void readAllNotifications()"
              :disable="mainStore.unreadCount == 0"
            />
          </div>

          <my-virtual-scroll
            :items="items"
            :margins="8"
            item-key="id"
            @load-more="loadMore"
            infinite-load-type="bottom"
            :key="scrollKey"
            class="posts-infinite-scroll"
            ref="virtualScroll"
            :min-item-height="60"
            :skeleton-height="60"
            no-items-key="notifications.no_notifications"
          >
            <template v-slot:default="{ item, index }">
              <notification-card :notif="item" :cache="notifCache" :class="{ 'q-mb-sm': index + 1 < items.length }" />
            </template>
            <template v-slot:skeleton>
              <rect-skeleton height="60px" class="card q-mb-sm" />
            </template>
          </my-virtual-scroll>
        </q-scroll-area>
      </div>
    </closeable-content>
  </q-dialog>
</template>
<script setup lang="ts">
import { useDialogPluginComponent } from "quasar";
import { type DefineComponent, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from "vue";
import type { CacheType } from "src/components/notifications/NotificationCard.vue";
import MyVirtualScroll from "../my/MyVirtualScroll.vue";
import MyIcon from "src/components/my/MyIcon.vue";
import MyButton from "src/components/my/MyButton.vue";
import RectSkeleton from "src/components/skeletons/RectSkeleton.vue";
import { getNotifications, readAllNotifications } from "src/api/users";
import { truncate } from "src/utils/format";
import { useMainStore } from "src/stores/main-store";
import websockets from "src/utils/websockets";
import CloseableContent from "../misc/CloseableContent.vue";
import NotificationCard from "src/components/notifications/NotificationCard.vue";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const mainStore = useMainStore();

const virtualScroll = ref<DefineComponent | null>(null);
const scrollKey = ref(Date.now());
const items = ref<ApiNotification[]>([]);

const notifCache = ref<Record<string, CacheType>>({});
let cursor: string | undefined = undefined;

const controller = new AbortController();

watch(
  mainStore.lastNotifications,
  (newVal) => {
    newVal.forEach((value) => {
      if (items.value.some((v) => value.id === v.id)) return;
      items.value.unshift(value);
      void nextTick(() => virtualScroll.value?.updateShowedItems());
    });
  },
  { deep: false, immediate: false }
);

async function loadMore(index: number, done: (stop?: boolean) => void) {
  try {
    const r = await getNotifications(cursor, 25, { signal: controller.signal });
    if (r.data.success) {
      cursor = r.data.data.next_cursor;
      r.data.data.notifications.forEach((value) => {
        if (value.message) value.message = truncate(value.message, 256);
        if (value.loaded?.content) value.loaded.content = truncate(value.loaded.content as string, 256);
      });
      items.value.push(...r.data.data.notifications);
      done(!r.data.data.has_more);
    } else {
      done(true);
    }
  } catch (e) {
    done(true);
    throw e;
  }
}

function on_read(data: { id: string } | object) {
  if ("id" in data) {
    const id = data.id;
    const notif = items.value.find((v) => v.id == id);
    if (notif && notif.unread) notif.unread = false;
  } else {
    for (const notif of items.value) {
      notif.unread = false;
    }
  }
}

onMounted(() => {
  websockets.on("notification_read", on_read);
});

onUnmounted(() => {
  controller.abort();
});

onBeforeUnmount(() => {
  websockets.off("notification_read", on_read);
});
</script>
