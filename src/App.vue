<template>
  <q-dialog
    v-model="offlineDialog"
    persistent
    seamless
    :maximized="true"
    transition-show="fade"
    transition-hide="fade"
    class="offline-dialog index-10000"
    v-if="$router.currentRoute.value.path != '/'"
  >
    <misc-layout :in-router="false" :show-dark-mode-toggle="true" class="layout">
      <div class="logo-container">
        <logo-component icon-class="logo" />
        <div class="label">{{ $t("connecting") }}...</div>
      </div>
    </misc-layout>
  </q-dialog>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, ref, watch, defineAsyncComponent, onBeforeMount, onBeforeUnmount } from "vue";
import { useMainStore } from "./stores/main-store";
import { type api as apiType } from "./boot/axios";
import { apiEndpoints } from "./api/config";
import { useQuasar } from "quasar";
import websockets from "src/utils/websockets";
import { useI18n } from "vue-i18n";

const LogoComponent = defineAsyncComponent(() => import("./components/misc/LogoComponent.vue"));
const MiscLayout = defineAsyncComponent(() => import("./layouts/MiscLayout.vue"));

let api: typeof apiType;

const { t } = useI18n();
const quasar = useQuasar();
const mainStore = useMainStore();
const offlineDialog = ref(false);
let pingIntervalWorking = false;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function ping() {
  if (!api) {
    api = (await import("./boot/axios")).api;
  }

  await delay(Math.random());
  try {
    await api.post(apiEndpoints.ping, undefined, {
      timeout: 3000
    });
  } catch {
    mainStore.connectTries += 1;
  }
}

function waitTime() {
  const time = Math.max(mainStore.connectTries - 4, 1) * 2;
  return Math.min(25, time);
}

async function pingInterval() {
  pingIntervalWorking = true;
  while (mainStore.isOffline) {
    await delay(waitTime() * 1000);
    await ping();
  }
  pingIntervalWorking = false;
}

function onChange() {
  if (mainStore.isOffline) {
    if (!pingIntervalWorking) void pingInterval();
    if (mainStore.connectTries >= 5) offlineDialog.value = true;
    else offlineDialog.value = false;
  } else {
    offlineDialog.value = false;
    mainStore.connectTries = 0;
    websockets.skipReconnectTimeout();
  }
}

watch(
  () => mainStore.isOffline,
  () => onChange()
);

watch(
  () => mainStore.connectTries,
  () => onChange()
);

watch(
  () => quasar.dark.isActive,
  () => {
    document.body.classList.add("no-animate");
    setTimeout(() => {
      document.body.classList.remove("no-animate");
    }, 1);
  }
);

watch(
  () => quasar.dark.isActive,
  () => {
    mainStore.updateColor(true);
  }
);

defineOptions({
  name: "App"
});

function newNotification(notification: ApiNotification) {
  if (mainStore.unreadCount != -1) mainStore.unreadCount++;
  mainStore.addNotification(notification);
  quasar.notify({
    avatar: notification.loaded?.user?.avatar_url ?? "",
    message: t(`notifications.${notification.type}`, { username: notification.loaded?.user?.username }),
    caption: notification.message ?? notification.loaded?.content ?? "",
    position: "top-right",
    type: "default-notification",
    timeout: 2000
  });
}

function onNotificationRead(data: { id: string; unread: number } | object) {
  if ("unread" in data) mainStore.unreadCount = data.unread;
  else mainStore.unreadCount = 0;

  const lastNotifications = mainStore.lastNotifications;
  if ("id" in data) {
    const id = data.id;
    const notif = lastNotifications.find((v) => v.id == id);
    if (notif && notif.unread) notif.unread = false;
  } else {
    for (const notif of lastNotifications) {
      notif.unread = false;
    }
  }
}

function wsOffline({ attempt }: { attempt: number }) {
  try {
    if (!mainStore.isOffline && attempt < 5)
      void api.post(apiEndpoints.ping, undefined, {
        timeout: 3000
      });
  } catch {
    // noop
  }
}

onMounted(() => {
  onChange();
  void pingInterval();

  websockets.on("notification", newNotification);
  websockets.on("notification_read", onNotificationRead);
  websockets.on("local__isOffline", wsOffline);
});

onBeforeMount(() => {
  quasar.dark.set(mainStore.getSetting("darkMode"));
  mainStore.updateColor(true);
});

onBeforeUnmount(() => {
  websockets.off("notification", newNotification);
  websockets.off("notification_read", onNotificationRead);
  websockets.off("local__isOffline", wsOffline);
});
</script>
