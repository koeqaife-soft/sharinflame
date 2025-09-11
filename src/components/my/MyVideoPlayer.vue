<template>
  <video-player
    :src="src"
    controls
    aspect-ratio="16:9"
    preload="metadata"
    class="my-video-player"
    :language="$t('locale')"
  />
</template>
<script setup lang="ts">
import { VideoPlayer } from "@videojs-player/vue";

defineProps<{
  src: string;
}>();
</script>
