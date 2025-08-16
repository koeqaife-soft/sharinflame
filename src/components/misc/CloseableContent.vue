<template>
  <div
    class="dialog-content"
    ref="dialogContent"
    style="touch-action: none"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend.passive="onTouchEnd"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{
  (event: "hide"): void;
}>();

let touchEndY = 0;
let touchEndX = 0;

let touchStartX = 0;
let touchStartY = 0;
let isSwiping = false;
let ignore = false;
const dialogContent = ref<HTMLElement | null>(null);

const SWIPE_THRESHOLD = 100;

function canScroll(el: HTMLElement, deltaY: number, deltaX: number): boolean {
  if (deltaY !== 0) {
    if (deltaY > 0) {
      return el.scrollTop !== 0;
    } else {
      return el.scrollTop + el.clientHeight < el.scrollHeight;
    }
  }

  if (deltaX !== 0) {
    if (deltaX > 0) {
      return el.scrollLeft !== 0;
    } else {
      return el.scrollLeft + el.clientWidth < el.scrollWidth;
    }
  }

  return false;
}

function hasScrollableParentInDirection(el: HTMLElement, deltaY: number, deltaX: number): boolean {
  let current: HTMLElement | null = el;

  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;

    const isScrollableY =
      (overflowY === "auto" || overflowY === "scroll") && current.scrollHeight > current.clientHeight;

    const isScrollableX = (overflowX === "auto" || overflowX === "scroll") && current.scrollWidth > current.clientWidth;

    if ((isScrollableY && canScroll(current, deltaY, 0)) || (isScrollableX && canScroll(current, 0, deltaX))) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

function shouldIgnore(target: EventTarget | null, deltaX: number, deltaY: number): boolean {
  if (!(target instanceof HTMLElement)) return true;

  if (target instanceof HTMLInputElement && target.type === "range") return true;
  if (hasScrollableParentInDirection(target, deltaY, deltaX)) return true;

  return false;
}

const onTouchStart = (event: TouchEvent) => {
  touchStartX = event.touches[0]!.clientX;
  touchStartY = event.touches[0]!.clientY;
  isSwiping = false;
  ignore = false;
};

const onTouchMove = (event: TouchEvent) => {
  touchEndX = event.touches[0]!.clientX;
  touchEndY = event.touches[0]!.clientY;

  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  if (ignore || shouldIgnore(event.target, Math.abs(deltaX) > 100 ? deltaX : 0, Math.abs(deltaY) > 100 ? deltaY : 0)) {
    if (dialogContent.value) {
      dialogContent.value.style.transform = "translateY(0)";
    }
    if (isSwiping) isSwiping = false;
    ignore = true;
    return;
  }

  if ((deltaY > 100 || deltaX > 100 || isSwiping) && Math.max(deltaY, deltaX) > 0) {
    isSwiping = true;
    if (dialogContent.value) {
      dialogContent.value.style.transform = `translateY(${Math.max(deltaY, deltaX)}px)`;
    }
  } else {
    if (dialogContent.value) {
      dialogContent.value.style.transform = "translateY(0)";
    }
  }
};

const onTouchEnd = () => {
  ignore = false;
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  if (Math.max(deltaY, deltaX) > SWIPE_THRESHOLD && isSwiping) {
    emit("hide");
  } else {
    if (dialogContent.value) {
      dialogContent.value.style.transform = "translateY(0)";
    }
  }
};
</script>
