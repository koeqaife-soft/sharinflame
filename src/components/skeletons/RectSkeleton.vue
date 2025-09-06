<template>
  <div class="skeleton" :class="{ animated: isAnimated }" :style="{ width, height }" />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

interface Props {
  width?: string;
  height?: string;
  waitTime?: number;
}

const props = withDefaults(defineProps<Props>(), {
  width: "100%",
  waitTime: 750
});

const isAnimated = ref(false);

onMounted(() => {
  setTimeout(() => {
    isAnimated.value = true;
  }, props.waitTime);
});
</script>
