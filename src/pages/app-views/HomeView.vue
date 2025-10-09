<template>
  <q-page class="home-view" :class="`columns-${columnsCount}`">
    <div class="left-column" v-if="!hideLeftColumn">
      <div class="card categories">
        <category-buttons :categories-list="categoriesList" :current-type="currentType" />
      </div>
    </div>
    <div class="center-column container" style="gap: 0px">
      <div class="full-height">
        <transition name="post-scroll">
          <post-scroll :type="currentType" :key="reloadKey" class="full-height full-width" @scroll="onScroll">
            <template #before>
              <div
                class="horizontal-container sticky-label categories-label card"
                :class="{ 'is-hidden': hideBar, scrolled }"
                v-if="hideLeftColumn"
              >
                <my-select :options="optionsList" v-model="currentType" />

                <q-space />
                <my-button icon="refresh" class="reload-button" @click="reloadKey = Date.now()" />
              </div>
            </template>
          </post-scroll>
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
            <my-button icon="expand_content" @click="openNotifications" />
          </div>
          <notifications-list />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, defineAsyncComponent, onBeforeMount, watch } from "vue";
import type { KeyOfGetPostsTypes } from "src/api/posts";
import { useI18n } from "vue-i18n";
import type { ButtonProps } from "src/components/misc/CategoryButtons.vue";
import { useMainStore } from "src/stores/main-store";
import PostScroll from "src/components/posts/PostScroll.vue";
import MyButton from "src/components/my/MyButton.vue";
import MyIcon from "src/components/my/MyIcon.vue";
import MySelect from "src/components/my/MySelect.vue";

const CategoryButtons = defineAsyncComponent(() => import("src/components/misc/CategoryButtons.vue"));
const NotificationsList = defineAsyncComponent(() => import("src/components/notifications/NotificationsList.vue"));
const ProfileMenu = defineAsyncComponent(() => import("src/components/profile/ProfileMenu.vue"));

const props = defineProps<{
  hideLeftColumn?: boolean;
  hideRightColumn?: boolean;
  hideNotifications?: boolean;
}>();

const mainStore = useMainStore();
const { t } = useI18n();

const columnsCount = computed(() => {
  let count = 3;
  if (props.hideLeftColumn) count--;
  if (props.hideRightColumn) count--;
  return count;
});

const currentType = ref<KeyOfGetPostsTypes>("popular");
const reloadKey = ref(Date.now());

const unreadNotificationsCount = computed(() => {
  return mainStore.getUnreadCount();
});

const hideBar = ref(false);
const scrolled = ref(false);

const changeType = (type: KeyOfGetPostsTypes) => {
  if (currentType.value == type) reloadKey.value = Date.now();
  else currentType.value = type;
};

function onScroll(info: QScrollObserverDetails) {
  hideBar.value = info.position.top > 150 && info.direction == "down";
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
    icon: "lightbulb",
    label: t("categories.new"),
    click: () => changeType("new"),
    type: "new"
  },
  {
    icon: "person_add",
    label: t("categories.following"),
    click: () => changeType("following"),
    type: "following"
  }
]);

const optionsList = [
  {
    labelKey: "categories.popular",
    icon: "whatshot",
    key: "popular"
  },
  {
    labelKey: "categories.new",
    icon: "lightbulb",
    key: "new"
  },
  {
    labelKey: "categories.following",
    icon: "group",
    key: "following"
  }
];

function openNotifications() {
  mainStore.openDialog("notifications", "", {});
}

watch(currentType, (v) => {
  localStorage.setItem("lastSelectedType", v);
});

onBeforeMount(() => {
  const lastSelectedType = localStorage.getItem("lastSelectedType");
  if (lastSelectedType && categoriesList.value.find((v) => v.type === lastSelectedType)) {
    currentType.value = lastSelectedType as KeyOfGetPostsTypes;
  }
});
</script>
