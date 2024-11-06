<template>
  <main-layout :show-dark-mode-toggle="false">
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
import { KeyOfGetPostsTypes } from "src/api/posts";
import PostScroll from "src/components/PostScroll.vue";
import CategoryButton, { ButtonProps } from "src/components/CategoryButton.vue";
import ProfileMenu from "src/components/ProfileMenu.vue";
import MainLayout from "src/layouts/MainLayout.vue";
import OpenProfileMenu from "src/components/OpenProfileMenu.vue";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const currentType = ref<KeyOfGetPostsTypes>("popular");
const isSmallScreen = ref(false);
const isBigScreen = ref(false);

const changeType = (type: KeyOfGetPostsTypes) => {
  console.log(type);
  currentType.value = type;
};

const categoriesList: ButtonProps[] = [
  {
    icon: "sym_o_whatshot",
    label: t("popular_posts"),
    click: () => changeType("popular"),
    type: "popular"
  },
  {
    icon: "sym_o_update",
    label: t("new_posts"),
    click: () => changeType("new"),
    type: "new"
  }
];

const updateScreenSize = () => {
  isSmallScreen.value = window.innerWidth <= 814;
  isBigScreen.value = window.innerWidth >= 1308;
};

onMounted(() => {
  updateScreenSize();
  window.addEventListener("resize", updateScreenSize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateScreenSize);
});
</script>
