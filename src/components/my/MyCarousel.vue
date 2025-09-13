<template>
  <div
    class="my-carousel"
    data-is-carousel="1"
    ref="carouselRef"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <my-button
      class="prev-btn"
      type="flat"
      icon="chevron_left"
      @click="prevSlide"
      v-show="slides[currentIndex - 1] !== undefined"
    />

    <div class="slides-container" :style="containerStyle">
      <template v-for="slide in slides" :key="slide.index">
        <div class="slide-element">
          <slot :data="slide.data" v-if="loadedSlides.includes(slide.index)" />
        </div>
      </template>
    </div>

    <my-button
      class="next-btn"
      type="flat"
      icon="chevron_right"
      @click="nextSlide"
      v-show="slides[currentIndex + 1] !== undefined"
    />

    <div class="pagination" v-if="slides.length > 1">
      <span
        v-for="(slide, index) in slides"
        :key="index"
        :class="['dot', { active: index === currentIndex }]"
        @click="goToSlide(index)"
      ></span>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import MyButton from "./MyButton.vue";
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";

interface Slide {
  index: number;
  data: T;
}

const props = defineProps<{ slides: T[] }>();

const currentIndex = ref(0);
const slides = computed<Slide[]>(() => props.slides.map((v, i) => ({ index: i, data: v })));
const loadedSlides = ref<number[]>([0]);

const carouselRef = ref<HTMLElement | null>(null);
const width = ref(0);

// drag state
const dragging = ref(false);
const startX = ref(0);
const deltaX = ref(0);

function updateWidth() {
  width.value = carouselRef.value ? carouselRef.value.clientWidth : window.innerWidth;
}

onMounted(() => {
  updateWidth();
  window.addEventListener("resize", updateWidth);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateWidth);
});

watch(currentIndex, () => {
  deltaX.value = 0;
  loadedSlides.value.push(currentIndex.value);
});

const containerStyle = computed(() => {
  const baseTranslate = -currentIndex.value * width.value;
  let translateX = baseTranslate + (dragging.value ? deltaX.value : deltaX.value);
  const transition = dragging.value ? "none" : "transform 0.3s ease";
  if (translateX > 0) translateX = 0;

  const allWidth = width.value * (slides.value.length - 1);
  if (-translateX > allWidth) translateX = -allWidth;

  return {
    transform: `translateX(${Math.round(translateX)}px)`,
    transition
  } as Record<string, string>;
});

function onTouchStart(e: TouchEvent) {
  if (slides.value.length == 1) return;
  if (e.touches.length !== 1) return;
  dragging.value = true;
  startX.value = e.touches[0]!.clientX;
  deltaX.value = 0;
}

function onTouchMove(e: TouchEvent) {
  if (slides.value.length == 1) return;
  if (!dragging.value || e.touches.length !== 1) return;
  const x = e.touches[0]!.clientX;
  deltaX.value = x - startX.value;
  if (deltaX.value > 0) {
    loadedSlides.value.push(currentIndex.value - 1);
  } else if (deltaX.value < 0) {
    loadedSlides.value.push(currentIndex.value + 1);
  }
  const absDx = Math.abs(deltaX.value);
  if (absDx > 8 && e.cancelable) {
    e.preventDefault();
  }
}

function onTouchEnd() {
  if (slides.value.length == 1) return;
  if (!dragging.value) return;
  dragging.value = false;

  const threshold = Math.max(40, width.value * 0.2);
  if (deltaX.value <= -threshold && currentIndex.value < slides.value.length - 1) {
    // swipe left -> next
    currentIndex.value++;
  } else if (deltaX.value >= threshold && currentIndex.value > 0) {
    // swipe right -> prev
    currentIndex.value--;
  }
  deltaX.value = 0;
}

function nextSlide() {
  if (currentIndex.value < slides.value.length - 1) currentIndex.value++;
}

function prevSlide() {
  if (currentIndex.value > 0) currentIndex.value--;
}

function goToSlide(index: number) {
  if (index < 0 || index >= slides.value.length) return;
  currentIndex.value = index;
}
</script>
