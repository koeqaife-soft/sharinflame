<template>
  <div class="my-image">
    <img :class="{ loaded: loaded }" loading="lazy" decoding="async" ref="imgRef" @load="onLoad" @error="onError" />
    <div v-if="loading" class="loading">
      <my-spinner size="50px" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, defineAsyncComponent, onMounted } from "vue";

const MySpinner = defineAsyncComponent(() => import("../my/MySpinner.vue"));

const props = defineProps<{ src: string }>();

const imgRef = ref<HTMLImageElement | null>(null);
const loading = ref<boolean | null>(null);
const loaded = ref(false);
let observer: IntersectionObserver | null = null;
let setSrcId: number | null = null;

function onLoad() {
  loading.value = false;
  loaded.value = true;
}

function onError() {
  loading.value = false;
}

function setSrc(src: string) {
  if (setSrcId !== null) return;
  loading.value = true;
  setSrcId = requestIdleCallback(
    () => {
      if (imgRef.value) imgRef.value.src = src;
      setSrcId = null;
    },
    { timeout: 25 }
  );
}

onMounted(() => {
  const checkVisibleNow = () => {
    if (!imgRef.value) return false;
    const rect = imgRef.value.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
  };

  if (checkVisibleNow()) {
    setSrc(props.src);
  } else {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.value) {
            setSrc(props.src);
            observer?.disconnect();
          }
        });
      },
      { threshold: 0.01 }
    );

    if (imgRef.value) observer.observe(imgRef.value);
  }
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
  if (imgRef.value) {
    setTimeout(() => {
      imgRef.value!.style.visibility = "hidden";
      imgRef.value!.src = "";
    }, 0);
  }
});
</script>
