<template>
  <q-skeleton type="rect" :height="height" class="card post post-skeleton" />
</template>
<script setup lang="ts">
import { randomSize } from "src/utils/random";

const props = defineProps<{
  height: string;
  minSize?: number;
  maxSize?: number;
}>();

const height = props.height === "random" ? randomSize(props.minSize || 125, props.maxSize || 300) : props.height;
</script>
