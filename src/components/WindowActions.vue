<template>
  <my-button icon="minimize" aria-label="Minimize" @click="minimizeWindow" class="webkit-no-drag" />
  <my-button icon="crop_square" aria-label="Maximize" @click="maximizeWindow" class="webkit-no-drag" />
  <my-button icon="close" aria-label="Close" @click="closeWindow" class="webkit-no-drag" />
</template>
<script setup lang="ts">
import MyButton from "./my/MyButton.vue";
function minimizeWindow() {
  window.electron.minimizeWindow();
}

function maximizeWindow() {
  window.electron.maximizeWindow();
}

function closeWindow() {
  window.electron.closeWindow();
}
</script>
