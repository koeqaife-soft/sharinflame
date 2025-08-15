<template>
  <main-layout :in-router="false" headers-class="index-10" class="full-height">
    <particles-background v-if="mainStore.getSetting('starBackground')" />
    <template #toolbar-actions v-if="hideRightColumn || hideNotifications">
      <div class="button-and-badge">
        <my-button icon="notifications" class="webkit-no-drag">
          <q-menu class="menu-card notifications-menu" v-model="notificationsMenuOpened">
            <notifications-list @on-loaded="notificationsMenuOpened = false" />
            <my-button
              icon="expand_content"
              type="primary"
              :label="$t('show_all')"
              class="full-width q-mt-sm"
              @click="openNotifications"
              v-close-popup
            />
          </q-menu>
        </my-button>
        <span class="button-badge" v-if="unreadNotificationsCount > 0">
          {{ unreadNotificationsCount }}
        </span>
      </div>
      <open-profile-menu v-if="hideRightColumn" />
    </template>
    <q-page class="app-page">
      <div class="left-column" v-if="!hideLeftColumn">
        <div class="card categories">
          <category-buttons :categories-list="categoriesList" :current-type="currentType" />
        </div>
      </div>
      <div class="center-column container" style="gap: 0px">
        <div class="horizontal-container categories-label card" :class="{ scrolled }" v-if="hideLeftColumn">
          <my-button :label="currentCategory?.label" :icon="currentCategory?.icon" :is-category="true" type="card">
            <q-menu class="categories-menu menu-card" v-model="categoriesMenuOpened">
              <category-buttons :categories-list="categoriesList" :current-type="currentType" />
            </q-menu>
            <template #append>
              <my-icon icon="arrow_drop_up" :class="['menu-arrow', { active: categoriesMenuOpened }]" />
            </template>
          </my-button>
          <q-space />
          <my-button icon="refresh" class="reload-button" @click="reloadKey = Date.now()" />
        </div>
        <div class="full-height">
          <transition name="post-scroll">
            <post-scroll :type="currentType" :key="reloadKey" class="full-height full-width" @scroll="onScroll" />
          </transition>
        </div>
      </div>
      <div class="right-column" v-if="!hideRightColumn">
        <div class="container right-column-content">
          <div class="card profile-menu">
            <profile-menu buttons-class="card-button" />
          </div>
          <div class="card notifications-list container" v-if="!hideNotifications">
            <div class="label-container horizontal-container card" @click="openNotifications">
              <my-icon icon="notifications" class="icon" />
              <div class="label">{{ $t("notifications.label") }}</div>
              <span class="unread-count" v-if="unreadNotificationsCount > 0">
                {{ unreadNotificationsCount }}
              </span>
              <q-space />
              <my-button icon="expand_content" />
            </div>
            <notifications-list />
          </div>
        </div>
      </div>
    </q-page>
  </main-layout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, defineAsyncComponent, onBeforeMount } from "vue";
import type { KeyOfGetPostsTypes } from "src/api/posts";
import { useI18n } from "vue-i18n";
import type { ButtonProps } from "src/components/misc/CategoryButtons.vue";
import { useMainStore } from "src/stores/main-store";
import PostScroll from "src/components/posts/PostScroll.vue";
import MainLayout from "src/layouts/MainLayout.vue";
import MyButton from "src/components/my/MyButton.vue";
import MyIcon from "src/components/my/MyIcon.vue";
import { useQuasar } from "quasar";

const CategoryButtons = defineAsyncComponent(() => import("src/components/misc/CategoryButtons.vue"));
const NotificationsList = defineAsyncComponent(() => import("src/components/notifications/NotificationsList.vue"));
const ProfileMenu = defineAsyncComponent(() => import("src/components/profile/ProfileMenu.vue"));
const OpenProfileMenu = defineAsyncComponent(() => import("src/components/profile/OpenProfileMenu.vue"));
const ParticlesBackground = defineAsyncComponent(() => import("src/components/ParticlesBackground.vue"));
const NotificationsDialog = defineAsyncComponent(() => import("src/components/notifications/NotificationsDialog.vue"));

const quasar = useQuasar();
const mainStore = useMainStore();
const { t } = useI18n();

const currentType = ref<KeyOfGetPostsTypes>("popular");
const reloadKey = ref(Date.now());
const currentCategory = computed(() => categoriesList.value.find((category) => category.type === currentType.value));

const categoriesMenuOpened = ref(false);
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

const scrolled = ref(false);

const changeType = (type: KeyOfGetPostsTypes) => {
  localStorage.setItem("lastSelectedType", type);
  if (currentType.value == type) reloadKey.value = Date.now();
  else currentType.value = type;
};

function onScroll(info: QScrollObserverDetails) {
  scrolled.value = info.position.top > 8;
}

const categoriesList = computed<ButtonProps[]>(() => [
  {
    icon: "whatshot",
    label: t("categories.popular"),
    click: () => changeType("popular"),
    type: "popular"
  },
  {
    icon: "update",
    label: t("categories.new"),
    click: () => changeType("new"),
    type: "new"
  },
  {
    icon: "group",
    label: t("categories.following"),
    click: () => changeType("following"),
    type: "following"
  }
]);

const updateScreenSize = () => {
  screenSize.value[0] = window.innerWidth;
  screenSize.value[1] = window.innerHeight;
};

function openNotifications() {
  quasar.dialog({
    component: NotificationsDialog
  });
}

onMounted(() => {
  updateScreenSize();
  window.addEventListener("resize", updateScreenSize, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateScreenSize);
});

onBeforeMount(() => {
  const lastSelectedType = localStorage.getItem("lastSelectedType");
  if (lastSelectedType && categoriesList.value.find((v) => v.type === lastSelectedType)) {
    currentType.value = lastSelectedType as KeyOfGetPostsTypes;
  }
});
</script>
