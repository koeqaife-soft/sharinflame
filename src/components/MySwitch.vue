<template>
  <div class="toggle-container">
    <div class="switch" :class="{ active: model }" @click.stop="toggle">
      <span class="slider"> </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineModel } from "vue";

const model = defineModel();

function toggle() {
  model.value = !model.value;
}
</script>
