<template>
  <div :class="containerClass || 'container'">
    <category-button
      v-for="category in categoriesList"
      :key="category.label"
      v-bind="category"
      :selected="currentType == category.type"
      :disabled="disabled"
    />
  </div>
</template>
<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import type { ButtonProps } from "./CategoryButton.vue";

const CategoryButton = defineAsyncComponent(() => import("./CategoryButton.vue"));

interface Props {
  categoriesList: ButtonProps[];
  currentType: string;
  containerClass?: string;
  disabled?: boolean;
}

defineProps<Props>();
</script>
