<template>
  <div class="container">
    <category-button
      v-for="category in categoriesList"
      :key="category.label"
      v-bind="category"
      :selected="currentType == category.type"
    />
  </div>
</template>
<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import type { ButtonProps } from "./CategoryButton.vue";
import { KeyOfGetPostsTypes } from "src/api/posts";

const CategoryButton = defineAsyncComponent(() => import("./CategoryButton.vue"));

interface Props {
  categoriesList: ButtonProps[];
  currentType: KeyOfGetPostsTypes;
}

defineProps<Props>();
</script>
