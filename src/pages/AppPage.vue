<template>
  <main-layout :in-router="false" headers-class="index-10" class="full-height">
    <particles-background v-if="mainStore.getSetting('starBackground')" :key="screenSize" />
    <template #toolbar-actions v-if="hideRightColumn">
      <open-profile-menu />
    </template>
    <q-page class="app-page">
      <div class="left-column" v-if="!hideLeftColumn">
        <div class="card categories">
          <category-buttons-container :categories-list="categoriesList" :current-type="currentType" />
        </div>
      </div>
      <div class="center-column">
        <post-scroll :type="currentType" :key="reloadKey" class="full-height full-width">
          <template #default v-if="hideLeftColumn">
            <div class="container categories-label card">
              <q-btn :label="currentCategory?.label" :icon="currentCategory?.icon" no-caps unelevated>
                <q-menu class="categories-menu menu-card" v-model="categoriesMenuOpened">
                  <category-buttons-container :categories-list="categoriesList" :current-type="currentType" />
                </q-menu>
                <q-icon name="sym_r_arrow_drop_up" :class="['open-menu', { active: categoriesMenuOpened }]" />
              </q-btn>
            </div>
          </template>
        </post-scroll>
      </div>
      <div class="right-column" v-if="!hideRightColumn">
        <div class="card profile-menu">
          <profile-menu buttons-class="card-button" />
        </div>
      </div>
    </q-page>
  </main-layout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, defineAsyncComponent } from "vue";
import type { KeyOfGetPostsTypes } from "src/api/posts";
import { useI18n } from "vue-i18n";
import type { ButtonProps } from "src/components/categories/CategoryButton.vue";
import PostScroll from "src/components/posts/PostScroll.vue";
import MainLayout from "src/layouts/MainLayout.vue";
import ParticlesBackground from "src/components/ParticlesBackground.vue";
import { useMainStore } from "src/stores/main-store";

const CategoryButtonsContainer = defineAsyncComponent(
  () => import("src/components/categories/CategoryButtonsContainer.vue")
);
const ProfileMenu = defineAsyncComponent(() => import("src/components/profile/ProfileMenu.vue"));
const OpenProfileMenu = defineAsyncComponent(() => import("src/components/profile/OpenProfileMenu.vue"));

const mainStore = useMainStore();
const { t } = useI18n();

const currentType = ref<KeyOfGetPostsTypes>("popular");
const reloadKey = ref(Date.now());
const currentCategory = computed(() => categoriesList.value.find((category) => category.type === currentType.value));

const categoriesMenuOpened = ref(false);

const screenSize = ref(window.innerWidth);
const isSmallScreen = computed(() => screenSize.value <= 850);
const isBigScreen = computed(() => screenSize.value >= 1200);

const hideLeftColumn = computed(() => !isBigScreen.value);
const hideRightColumn = computed(() => isSmallScreen.value);

const changeType = (type: KeyOfGetPostsTypes) => {
  if (currentType.value == type) reloadKey.value = Date.now();
  else currentType.value = type;
};

const categoriesList = computed<ButtonProps[]>(() => [
  {
    icon: "sym_r_whatshot",
    label: t("categories.popular"),
    click: () => changeType("popular"),
    type: "popular"
  },
  {
    icon: "sym_r_update",
    label: t("categories.new"),
    click: () => changeType("new"),
    type: "new"
  },
  {
    icon: "sym_r_group",
    label: t("categories.following"),
    click: () => changeType("following"),
    type: "following"
  }
]);

const updateScreenSize = () => {
  screenSize.value = window.innerWidth;
};

onMounted(() => {
  updateScreenSize();
  window.addEventListener("resize", updateScreenSize, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateScreenSize);
});
</script>
