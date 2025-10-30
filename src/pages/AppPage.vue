<template>
  <main-layout :in-router="false" headers-class="index-10" class="full-height">
    <particles-background v-if="mainStore.getSetting('starBackground')" />
    <template #before-space v-if="!$q.platform.is.mobile">
      <div class="top-action-bar webkit-no-drag">
        <my-button icon="home" is-category :class="{ selected: currentView == 'home' }" @click="currentView = 'home'" />
        <my-button icon="chat" is-category :class="{ selected: currentView == 'chat' }" @click="currentView = 'chat'" />
      </div>
    </template>
    <template #toolbar-actions v-if="(hideRightColumn || hideNotifications) && !$q.platform.is.mobile">
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
        <span class="button-badge on-toolbar" v-if="unreadNotificationsCount > 0">
          {{ unreadNotificationsCount }}
        </span>
      </div>
      <open-profile-menu v-if="hideRightColumn" />
    </template>
    <transition name="crossfade" mode="out-in">
      <keep-alive>
        <home-view
          v-if="currentView == 'home'"
          :hide-left-column="hideLeftColumn"
          :hide-right-column="hideRightColumn"
          :hide-notifications="hideNotifications"
          key="home"
          class="app-view"
        />
        <chat-view v-else-if="currentView == 'chat'" key="chat" class="app-view" />
      </keep-alive>
    </transition>
  </main-layout>
  <div class="bottom-bar" v-if="$q.platform.is.mobile">
    <my-button icon="home" is-category :class="{ selected: currentView == 'home' }" @click="currentView = 'home'" />
    <my-button icon="chat" is-category :class="{ selected: currentView == 'chat' }" @click="currentView = 'chat'" />
    <my-button icon="add_2" @click="mainStore.openDialog('postEditor', '', {})" />
    <div class="button-and-badge">
      <my-button icon="notifications" @click="mainStore.openDialog('notifications', '', {})" />
      <span class="button-badge" v-if="unreadNotificationsCount > 0">
        {{ unreadNotificationsCount }}
      </span>
    </div>
    <open-profile-menu />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, defineAsyncComponent, onBeforeMount } from "vue";
import { useMainStore } from "src/stores/main-store";
import { readAllNotifications } from "src/api/users";
import MainLayout from "src/layouts/MainLayout.vue";
import MyButton from "src/components/my/MyButton.vue";
import OpenProfileMenu from "src/components/profile/OpenProfileMenu.vue";
import { initPush } from "src/utils/worker";
import { watch } from "vue";

const NotificationsList = defineAsyncComponent(() => import("src/components/notifications/NotificationsList.vue"));
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

const hideLeftColumn = computed(() => currentView.value != "home" || !isBigScreen.value);
const hideRightColumn = computed(() => currentView.value != "home" || isSmallScreen.value);
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

watch(currentView, (v) => {
  localStorage.setItem("lastAppView", v);
});

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

onBeforeMount(() => {
  const lastView = localStorage.getItem("lastAppView");
  if (lastView == "home" || lastView == "chat") currentView.value = lastView;
});
</script>
