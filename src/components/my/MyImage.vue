<template>
  <div class="my-image">
    <img :src="src" loading="lazy" ref="imgRef" />
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

defineProps<{
  src: string;
}>();

const imgRef = ref<HTMLImageElement | null>(null);

onBeforeUnmount(() => {
  if (imgRef.value) {
    imgRef.value.src = "";
  }
});
</script>
