<template>
  <div class="card label-container" style="z-index: 2">
    <div class="horizontal-container">
      <q-icon v-if="icon" :name="icon" class="icon" />
      <div>{{ label }}</div>
      <q-space />
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  label: string;
  icon?: string;
}>();
</script>
