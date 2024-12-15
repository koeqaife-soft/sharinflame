<template>
  <main-layout :in-router="false" :menu-opened="categoriesMenuOpened" headers-class="index-10" class="full-height">
    <template #toolbar-actions v-if="hideRightColumn">
      <open-profile-menu />
    </template>
    <template #logo-menu v-if="hideLeftColumn">
      <q-menu class="categories-menu menu-card" v-model="categoriesMenuOpened">
        <category-buttons-container :categories-list="categoriesList" :current-type="currentType" />
      </q-menu>
    </template>
    <q-page class="app-page">
      <div class="left-column" v-if="!hideLeftColumn">
        <q-card class="card categories">
          <category-buttons-container :categories-list="categoriesList" :current-type="currentType" />
        </q-card>
      </div>
      <div class="center-column">
        <post-scroll :type="currentType" class="full-height full-width" />
      </div>
      <div class="right-column" v-if="!hideRightColumn">
        <q-card class="card profile-menu">
          <profile-menu buttons-class="card-button" />
        </q-card>
      </div>
    </q-page>
  </main-layout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, defineAsyncComponent } from "vue";
import { KeyOfGetPostsTypes } from "src/api/posts";
import { useI18n } from "vue-i18n";
import type { ButtonProps } from "src/components/categories/CategoryButton.vue";
import PostScroll from "src/components/posts/PostScroll.vue";
import MainLayout from "src/layouts/MainLayout.vue";

const CategoryButtonsContainer = defineAsyncComponent(
  () => import("src/components/categories/CategoryButtonsContainer.vue")
);
const ProfileMenu = defineAsyncComponent(() => import("src/components/profile/ProfileMenu.vue"));
const OpenProfileMenu = defineAsyncComponent(() => import("src/components/profile/OpenProfileMenu.vue"));

const { t } = useI18n();

const currentType = ref<KeyOfGetPostsTypes>("popular");

const categoriesMenuOpened = ref(false);

const screenSize = ref(window.innerWidth);
const isSmallScreen = computed(() => screenSize.value <= 814);
const isBigScreen = computed(() => screenSize.value >= 1200);

const hideLeftColumn = computed(() => !isBigScreen.value);
const hideRightColumn = computed(() => isSmallScreen.value);

const changeType = (type: KeyOfGetPostsTypes) => {
  currentType.value = type;
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
  }
]);

const updateScreenSize = () => {
  screenSize.value = window.innerWidth;
};

onMounted(() => {
  updateScreenSize();
  window.addEventListener("resize", updateScreenSize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateScreenSize);
});
</script>
