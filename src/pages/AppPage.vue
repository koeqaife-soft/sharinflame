<template>
  <main-layout :in-router="false">
    <template #toolbar-actions v-if="!isBigScreen">
      <open-profile-menu />
    </template>
    <q-page class="app-page">
      <div class="left-column" v-if="!isSmallScreen">
        <q-card class="card categories">
          <div class="container">
            <category-button
              v-for="category in categoriesList"
              :key="category.label"
              v-bind="category"
              :selected="currentType == category.type"
            />
          </div>
        </q-card>
      </div>
      <post-scroll :type="currentType" class="center-column" />
      <div class="right-column" v-if="isBigScreen">
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
import type { ButtonProps } from "src/components/CategoryButton.vue";
import PostScroll from "src/components/PostScroll.vue";
import MainLayout from "src/layouts/MainLayout.vue";

const CategoryButton = defineAsyncComponent(() => import("src/components/CategoryButton.vue"));
const ProfileMenu = defineAsyncComponent(() => import("src/components/ProfileMenu.vue"));
const OpenProfileMenu = defineAsyncComponent(() => import("src/components/OpenProfileMenu.vue"));

const { t } = useI18n();

const currentType = ref<KeyOfGetPostsTypes>("popular");

const screenSize = ref(window.innerWidth);
const isSmallScreen = computed(() => screenSize.value <= 814);
const isBigScreen = computed(() => screenSize.value >= 1200);

const changeType = (type: KeyOfGetPostsTypes) => {
  console.log(type);
  currentType.value = type;
};

const categoriesList = computed<ButtonProps[]>(() => [
  {
    icon: "sym_r_whatshot",
    label: t("popular_posts"),
    click: () => changeType("popular"),
    type: "popular"
  },
  {
    icon: "sym_r_update",
    label: t("new_posts"),
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
