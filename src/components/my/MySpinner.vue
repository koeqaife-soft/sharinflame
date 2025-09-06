<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 300 150"
    class="my-spinner"
    :height="size"
    :width="size"
    ref="spinner"
  >
    <path
      fill="none"
      stroke="currentColor"
      stroke-width="25"
      stroke-linecap="round"
      stroke-dasharray="300 385"
      stroke-dashoffset="0"
      d="M275 75c0 31-27 50-50 50-58 0-92-100-150-100-28 0-50 22-50 50s23 50 50 50c58 0 92-100 150-100 24 0 50 19 50 50Z"
      ref="path"
    >
      <animate
        attributeName="stroke-dashoffset"
        calcMode="spline"
        dur="2s"
        values="685;-685"
        keySplines="0 0 1 1"
        repeatCount="indefinite"
      />
    </path>
  </svg>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

defineProps<{
  size: string | number;
}>();

const spinner = ref<SVGSVGElement | null>(null);
const path = ref<SVGPathElement | null>(null);
let observer: IntersectionObserver | null = null;

const toggleAnimation = (play: boolean) => {
  if (!path.value) return;
  const animateEl = path.value.querySelector("animate");
  if (!animateEl) return;
  if (play) animateEl.setAttribute("begin", "0s");
  else animateEl.removeAttribute("begin");
};

const checkVisibility = () => {
  if (!document.hidden) {
    observer?.observe(spinner.value!);
  } else {
    toggleAnimation(false);
  }
};

const handleWindowFocus = () => {
  if (spinner.value && document.visibilityState === "visible") {
    observer?.observe(spinner.value);
  }
};

const handleWindowBlur = () => {
  toggleAnimation(false);
};

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        toggleAnimation(entry.isIntersecting && !document.hidden);
      });
    },
    { threshold: 0.1 }
  );

  checkVisibility();
  document.addEventListener("visibilitychange", checkVisibility, { passive: true });
  window.addEventListener("focus", handleWindowFocus, { passive: true });
  window.addEventListener("blur", handleWindowBlur, { passive: true });
});

onBeforeUnmount(() => {
  observer?.disconnect();
  document.removeEventListener("visibilitychange", checkVisibility);
  document.removeEventListener("focus", handleWindowFocus);
  document.removeEventListener("blur", handleWindowBlur);
});
</script>
