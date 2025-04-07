<template>
  <div :class="containerClass || 'container'">
    <q-btn
      v-for="category in categoriesList"
      :key="category.label"
      :icon="category.icon"
      :label="category.label"
      class="card-button category-button"
      :class="{ selected: currentType == category.type }"
      :disable="disabled"
      @click="category.click"
      unelevated
      no-caps
    />
  </div>
</template>
<script setup lang="ts">
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
