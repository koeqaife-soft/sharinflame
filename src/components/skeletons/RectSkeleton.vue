<template>
  <q-skeleton type="rect" :height="height" class="card post post-skeleton" />
</template>
<script setup lang="ts">
import { randomSize } from "src/utils/random";

const props = defineProps<{
  height: string;
}>();

const height = props.height === "random" ? randomSize(125, 300) : props.height;
</script>
