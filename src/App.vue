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
import { initPush } from "./utils/worker";

const LogoComponent = defineAsyncComponent(() => import("./components/misc/LogoComponent.vue"));
const MiscLayout = defineAsyncComponent(() => import("./layouts/MiscLayout.vue"));

let api: typeof apiType;

const { t } = useI18n();
const quasar = useQuasar();
const mainStore = useMainStore();
const offlineDialog = ref(false);
let pingIntervalWorking = false;

type NotificationItem = { desktopNotification: Notification; data: ApiNotification };
const lastNotifications: Record<string, NotificationItem> = {};

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
  () => quasar.dark.mode,
  () => {
    mainStore.setSettings("darkMode", quasar.dark.mode);
  }
);

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

function decodeHTMLEntities(input: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = input;
  return textarea.value;
}

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

  if (Notification.permission == "granted" && !document.hasFocus() && mainStore.getSetting("getNotifications")) {
    const key = `${notification.from_id}`;
    if (lastNotifications[key]) lastNotifications[key].desktopNotification.close();

    const newNotification = new Notification(
      t(`notifications.${notification.type}`, { username: notification.loaded?.user?.username }),
      {
        body: decodeHTMLEntities(notification.message ?? notification.loaded?.content ?? ""),
        icon: notification.loaded?.user.avatar_url ? notification.loaded?.user.avatar_url : "",
        tag: `notif-${notification.id}`,
        vibrate: [100, 50, 100]
      } as NotificationOptions
    );
    lastNotifications[key] = {
      desktopNotification: newNotification,
      data: notification
    };
    newNotification.onclose = () => {
      if (lastNotifications[key]?.desktopNotification == newNotification) delete lastNotifications[key];
    };
  }
}

function onNotificationRead(data: { id: string; unread: number } | object) {
  if ("unread" in data) mainStore.unreadCount = data.unread;
  else mainStore.unreadCount = 0;

  const _lastNotifications = mainStore.lastNotifications;
  if ("id" in data) {
    const id = data.id;
    const notif = _lastNotifications.find((v) => v.id == id);
    if (notif && notif.unread) notif.unread = false;

    Object.values(lastNotifications).forEach((value) => {
      if (value.data.id == data.id) value.desktopNotification.close();
    });
  } else {
    for (const notif of _lastNotifications) {
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

function onReturn() {
  for (let i = mainStore.dialogStack.length - 1; i >= 0; i--) {
    const dialogKey = mainStore.dialogStack[i]!;
    const dialog = mainStore.openedDialogs.get(dialogKey);
    if (dialog && dialog.hide()) break;
  }
  history.pushState({ time: Date.now() }, "");
}

function updateActivity() {
  websockets.lastActive = Date.now() / 1000;
}

function onFocus() {
  websockets.lastActive = Date.now() / 1000;
  websockets.sendHeartbeat();
}

onMounted(() => {
  onChange();
  void pingInterval();

  websockets.on("notification", newNotification);
  websockets.on("notification_read", onNotificationRead);
  websockets.on("local__isOffline", wsOffline);

  history.pushState({ time: Date.now() }, "");
  window.addEventListener("popstate", onReturn);

  ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"].forEach((event) =>
    window.addEventListener(event, updateActivity, { passive: true })
  );

  window.addEventListener("focus", onFocus, { passive: true });

  websockets.on("success_auth", async () => {
    if (mainStore.getSetting("getNotifications") === true) await initPush();
    websockets.sendHeartbeat();
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SW_PING") {
      event.ports[0]!.postMessage({ canHandle: websockets.isConnected() });
    }
  });
});

onBeforeMount(() => {
  quasar.dark.set(mainStore.getSetting("darkMode"));
  mainStore.updateColor(true);
});

onBeforeUnmount(() => {
  websockets.off("notification", newNotification);
  websockets.off("notification_read", onNotificationRead);
  websockets.off("local__isOffline", wsOffline);
  window.removeEventListener("popstate", onReturn);
  window.removeEventListener("focus", onFocus);

  ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"].forEach((event) =>
    window.removeEventListener(event, updateActivity)
  );
});
</script>
