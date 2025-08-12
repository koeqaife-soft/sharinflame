<template>
  <div :class="containerClass || 'container'">
    <my-button
      v-for="category in categoriesList"
      :key="category.label"
      :icon="category.icon"
      :label="category.label"
      type="card"
      :isCategory="true"
      :class="{ selected: currentType == category.type }"
      :disable="disabled"
      @click="category.click"
    />
  </div>
</template>
<script setup lang="ts">
import MyButton from "../my/MyButton.vue";

export interface ButtonProps {
  label: string;
  icon: string;
  click: () => void;
  type?: string;
  disabled?: boolean;
}

interface Props {
  categoriesList: ButtonProps[];
  currentType: string;
  containerClass?: string;
  disabled?: boolean;
}

defineProps<Props>();
</script>
