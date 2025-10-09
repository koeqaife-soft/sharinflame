<template>
  <main-layout :in-router="false" headers-class="index-10" class="full-height">
    <particles-background v-if="mainStore.getSetting('starBackground')" />
    <template #toolbar-actions v-if="hideRightColumn || hideNotifications">
      <div class="button-and-badge">
        <my-button icon="notifications" class="webkit-no-drag" v-if="hideNotifications">
          <q-menu class="menu-card notifications-menu" v-model="notificationsMenuOpened" max-height="999px">
            <notifications-list @on-loaded="notificationsMenuOpened = false" />
            <div class="horizontal-container">
              <my-button
                icon="expand_content"
                type="primary"
                :label="$t('show_all')"
                class="full-width q-mt-sm centered"
                @click="openNotifications"
                v-close-popup
              />
              <my-button
                icon="mark_chat_read"
                type="outlined"
                :label="$t('read_all')"
                class="full-width q-mt-sm centered"
                @click="() => void readAllNotifications()"
                :disable="mainStore.unreadCount == 0"
                v-close-popup
              />
            </div>
          </q-menu>
        </my-button>
        <span class="button-badge" v-if="unreadNotificationsCount > 0">
          {{ unreadNotificationsCount }}
        </span>
      </div>
      <open-profile-menu v-if="hideRightColumn" />
    </template>
    <keep-alive>
      <home-view
        v-if="currentView == 'home'"
        :hide-left-column="hideLeftColumn"
        :hide-right-column="hideRightColumn"
        :hide-notifications="hideNotifications"
      />
      <chat-view v-else-if="currentView == 'chat'" />
    </keep-alive>
  </main-layout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, defineAsyncComponent } from "vue";
import { useMainStore } from "src/stores/main-store";
import { readAllNotifications } from "src/api/users";
import MainLayout from "src/layouts/MainLayout.vue";
import MyButton from "src/components/my/MyButton.vue";
import { initPush } from "src/utils/worker";

const NotificationsList = defineAsyncComponent(() => import("src/components/notifications/NotificationsList.vue"));
const OpenProfileMenu = defineAsyncComponent(() => import("src/components/profile/OpenProfileMenu.vue"));
const ParticlesBackground = defineAsyncComponent(() => import("src/components/ParticlesBackground.vue"));
const HomeView = defineAsyncComponent(() => import("src/pages/app-views/HomeView.vue"));
const ChatView = defineAsyncComponent(() => import("src/pages/app-views/ChatView.vue"));

const mainStore = useMainStore();

const currentView = ref<"home" | "chat">("home");

const notificationsMenuOpened = ref(false);

const screenSize = ref<[number, number]>([window.innerWidth, window.innerHeight]);
const isSmallScreen = computed(() => screenSize.value[0] <= 850);
const isBigScreen = computed(() => screenSize.value[0] >= 1200);
const isShortScreen = computed(() => screenSize.value[1] <= 750);

const hideLeftColumn = computed(() => !isBigScreen.value);
const hideRightColumn = computed(() => isSmallScreen.value);
const hideNotifications = computed(() => hideRightColumn.value || isShortScreen.value);

const unreadNotificationsCount = computed(() => {
  return mainStore.getUnreadCount();
});

const updateScreenSize = () => {
  screenSize.value[0] = window.innerWidth;
  screenSize.value[1] = window.innerHeight;
};

function openNotifications() {
  mainStore.openDialog("notifications", "", {});
}

async function getNotificationPermission() {
  await Notification.requestPermission();
  mainStore.openedDialogs.get("okCancel")?.hide();
  mainStore.setSettings("getNotifications", true);
  await initPush();
}

onMounted(() => {
  updateScreenSize();
  window.addEventListener("resize", updateScreenSize, { passive: true });

  if (Notification.permission != "denied" && mainStore.getSetting("getNotifications") === undefined) {
    mainStore.openDialog(
      "okCancel",
      "",
      {
        localeKey: "notification_permission",
        okKey: "yes",
        cancelKey: "no"
      },
      () => void getNotificationPermission(),
      () => mainStore.setSettings("getNotifications", false)
    );
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateScreenSize);
});
</script>
