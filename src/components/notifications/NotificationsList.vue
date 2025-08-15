<template>
  <div class="notifications">
    <div class="notifications-container">
      <div v-if="loading && showLoading" class="loading container">
        <rect-skeleton v-for="i in 5" :key="i" class="notification-skeleton" height="60px" />
      </div>
      <template v-else-if="!loading">
        <div v-if="notifications.length === 0" class="no-notifications">
          {{ $t("notifications.no_notifications") }}
        </div>
        <transition-group name="notification" tag="div" class="container">
          <notification-card
            v-for="notif in notifications"
            :key="notif.id"
            :notif="notif"
            @on-loaded="emit('onLoaded')"
          />
        </transition-group>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useMainStore } from "src/stores/main-store";
import { getNotifications } from "src/api/users";
import { truncate } from "src/utils/format";
import websockets from "src/utils/websockets";

const mainStore = useMainStore();

const NotificationCard = defineAsyncComponent(() => import("./NotificationCard.vue"));
const RectSkeleton = defineAsyncComponent(() => import("src/components/skeletons/RectSkeleton.vue"));

const emit = defineEmits<{
  (e: "onLoaded"): void;
}>();

const notifications = ref<ApiNotification[]>([]);
const loading = ref(true);
const showLoading = ref(false);
let showLoadingTimeout: NodeJS.Timeout | null = null;

watch(
  mainStore.lastNotifications,
  (newVal) => {
    notifications.value = newVal.map((value) => {
      const old = notifications.value.find((v) => value.id === v.id);
      if (old) return old;

      if (value.message) value.message = truncate(value.message, 32);
      if (value.loaded?.content) value.loaded.content = truncate(value.loaded.content, 32);
      return value;
    });
    if (newVal.length > 0) {
      loading.value = false;
      showLoading.value = false;
    }
  },
  { immediate: true }
);

function on_read(data: { id: string } | object) {
  if ("id" in data) {
    const id = data.id;
    const notif = notifications.value.find((v) => v.id == id);
    if (notif && notif.unread) notif.unread = false;
  } else {
    for (const notif of notifications.value) {
      notif.unread = false;
    }
  }
}

onMounted(() => {
  showLoadingTimeout = setTimeout(() => {
    showLoading.value = true;
  }, 150);

  websockets.on("notification_read", on_read);

  if (mainStore.lastNotifications.length === 0) {
    void getNotifications(undefined, 5).then((response) => {
      if (showLoadingTimeout) clearTimeout(showLoadingTimeout);
      if (response.data.success) {
        response.data.data.notifications.reverse().forEach((notif) => {
          mainStore.addNotification(notif);
        });
      }
    });
  }
});

onBeforeUnmount(() => {
  websockets.off("notification_read", on_read);
});
</script>
