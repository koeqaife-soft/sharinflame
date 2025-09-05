<template>
  <div class="cropper-container">
    <cropper
      class="cropper"
      :src="img"
      :stencil-props="{
        aspectRatio: aspectRatio,
        width: 500,
        height: 500
      }"
      image-restriction="stencil"
      :stencil-component="isCircle ? CircleStencil : undefined"
      @change="change"
    />
  </div>
  <div class="buttons-container">
    <my-button :label="$t('cancel')" @click="emit('dismiss')" type="flat" icon="close" :disable="loading" />
    <my-button :label="$t('apply')" @click="onApply" type="primary" icon="check" :loading="loading" />
  </div>
</template>
<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import { Cropper, CircleStencil } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import MyButton from "../my/MyButton.vue";

const loading = ref(false);

const props = defineProps<{
  img: string;
  aspectRatio: number;
  isCircle: boolean;
}>();

let imgCanvas: HTMLCanvasElement | null = null;

const emit = defineEmits<{
  (e: "apply", blob: Blob): void;
  (e: "dismiss"): void;
}>();

function change({ canvas }: { canvas: HTMLCanvasElement }) {
  imgCanvas = canvas;
}

function onApply() {
  if (!imgCanvas) return;

  imgCanvas.toBlob(
    (blob) => {
      if (!blob) return;
      emit("apply", blob);
    },
    "image/webp",
    0.9
  );
  loading.value = true;
}

onUnmounted(() => {
  if (props.img.startsWith("blob:")) {
    URL.revokeObjectURL(props.img);
  }
});
</script>
