<template>
  <div class="my-image">
    <img :src="src" loading="lazy" />
  </div>
</template>
<script setup lang="ts">
defineProps<{
  src: string;
}>();
</script>
