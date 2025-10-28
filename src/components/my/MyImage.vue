<template>
  <div class="my-image">
    <img :src="src" loading="lazy" decoding="async" ref="imgRef" @load="onLoad" @error="onError" />
    <div v-if="loading" class="loading">
      <my-spinner size="50px" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, defineAsyncComponent, onMounted } from "vue";

const MySpinner = defineAsyncComponent(() => import("../my/MySpinner.vue"));

defineProps<{ src: string }>();

const imgRef = ref<HTMLImageElement | null>(null);
const loading = ref<boolean | null>(null);
let observer: IntersectionObserver | null = null;

function onLoad() {
  loading.value = false;
}

function onError() {
  loading.value = false;
}

onMounted(() => {
  const checkVisibleNow = () => {
    if (!imgRef.value) return false;
    const rect = imgRef.value.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
  };

  if (checkVisibleNow()) {
    loading.value = true;
  } else {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.value) {
            if (loading.value == null) loading.value = true;
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
      imgRef.value!.src = "";
    }, 0);
  }
});
</script>
