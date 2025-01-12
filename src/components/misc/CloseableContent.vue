<template>
  <div
    class="dialog-content"
    ref="dialogContent"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{
  (event: "hide"): void;
}>();

const touchStartX = ref(0);
const touchStartY = ref(0);
const touchEndX = ref(0);
const touchEndY = ref(0);
const isSwiping = ref(false);
const dialogContent = ref<HTMLElement | null>(null);
const verticalExceeded = ref(false);

const SWIPE_THRESHOLD_X = 100;
const SWIPE_THRESHOLD_Y = 10;

const onTouchStart = (event: TouchEvent) => {
  touchStartX.value = event.touches[0]!.clientX;
  touchStartY.value = event.touches[0]!.clientY;
  isSwiping.value = false;
  verticalExceeded.value = false;
};

const onTouchMove = (event: TouchEvent) => {
  touchEndX.value = event.touches[0]!.clientX;
  touchEndY.value = event.touches[0]!.clientY;

  const deltaX = touchEndX.value - touchStartX.value;
  const deltaY = Math.abs(touchEndY.value - touchStartY.value);

  if (deltaY > SWIPE_THRESHOLD_Y && deltaX < 30) {
    verticalExceeded.value = true;
    onTouchEnd();
    return;
  }

  if (deltaX > 10 && !verticalExceeded.value) {
    isSwiping.value = true;
    if (dialogContent.value) {
      dialogContent.value.style.transform = `translateY(${deltaX}px)`;
    }
  }
};

const onTouchEnd = () => {
  if (verticalExceeded.value) {
    if (dialogContent.value) {
      dialogContent.value.style.transform = "translateY(0)";
    }
    return;
  }

  const deltaX = touchEndX.value - touchStartX.value;

  if (deltaX > SWIPE_THRESHOLD_X && isSwiping.value) {
    emit("hide");
  } else {
    if (dialogContent.value) {
      dialogContent.value.style.transform = "translateY(0)";
    }
  }
};
</script>

<style scoped>
.dialog-content {
  touch-action: none;
}
</style>
