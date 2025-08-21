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
let moveDeltaX = 0;
let moveDeltaY = 0;

let isSwiping = false;
let ignoreX = false;
let ignoreY = false;
const dialogContent = ref<HTMLElement | null>(null);

const SWIPE_THRESHOLD = 100;

function canScroll(el: HTMLElement, deltaY: number, deltaX: number): boolean {
  if (deltaX !== 0) {
    if (deltaX > 0) {
      return el.scrollLeft !== 0;
    } else {
      return el.scrollLeft + el.clientWidth < el.scrollWidth;
    }
  }
  if (deltaY !== 0) {
    if (deltaY > 0) {
      return el.scrollTop !== 0;
    } else {
      return el.scrollTop + el.clientHeight < el.scrollHeight;
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

  if (hasScrollableParentInDirection(target, deltaY, deltaX)) return true;

  return false;
}

const onTouchStart = (event: TouchEvent) => {
  touchStartX = event.touches[0]!.clientX;
  touchStartY = event.touches[0]!.clientY;
  isSwiping = false;
  ignoreX = false;
  ignoreY = false;
};

const getSwipeDelta = () => {
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  if (ignoreX && ignoreY) {
    return 0;
  } else if (ignoreY) {
    return deltaX;
  } else if (ignoreX) {
    return deltaY;
  } else {
    return Math.max(deltaX, deltaY);
  }
};

const getMoveSwipeDelta = () => {
  if (ignoreX && ignoreY) {
    return 0;
  } else if (ignoreY) {
    return moveDeltaX;
  } else if (ignoreX) {
    return moveDeltaY;
  } else {
    return Math.max(moveDeltaX, moveDeltaY);
  }
};

const onTouchMove = (event: TouchEvent) => {
  moveDeltaX = event.touches[0]!.clientX - touchEndX;
  moveDeltaY = event.touches[0]!.clientY - touchEndY;
  touchEndX = event.touches[0]!.clientX;
  touchEndY = event.touches[0]!.clientY;

  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  if (event.target instanceof HTMLInputElement && event.target.type === "range") {
    ignoreX = true;
    ignoreY = true;
  }

  if ((Math.abs(deltaY) > 100 && !ignoreY) || (deltaX > deltaY && shouldIgnore(event.target, deltaX, 0))) {
    ignoreX = true;
  }
  if ((Math.abs(deltaX) > 100 && !ignoreX) || (deltaY > deltaX && shouldIgnore(event.target, 0, deltaY))) {
    ignoreY = true;
  }

  const swipeDelta = getSwipeDelta();
  if (swipeDelta > 25 || isSwiping) {
    isSwiping = true;
    if (dialogContent.value) {
      dialogContent.value.style.transform = `translateY(${Math.max(swipeDelta, 0)}px)`;
    }
  } else {
    if (dialogContent.value) {
      dialogContent.value.style.transform = "translateY(0)";
    }
  }
};

const onTouchEnd = () => {
  if (isSwiping && getSwipeDelta() > SWIPE_THRESHOLD && getMoveSwipeDelta() > 0) {
    emit("hide");
  } else {
    if (dialogContent.value) {
      dialogContent.value.style.transform = "translateY(0)";
    }
  }
};
</script>
