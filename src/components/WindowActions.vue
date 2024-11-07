<template>
  <q-btn
    flat
    dense
    round
    icon="sym_r_minimize"
    aria-label="Minimize"
    @click="minimizeWindow"
    v-if="$q.platform.is.electron"
    class="webkit-no-drag"
  />
  <q-btn
    flat
    dense
    round
    icon="sym_r_crop_square"
    aria-label="Maximize"
    @click="maximizeWindow"
    v-if="$q.platform.is.electron"
    class="webkit-no-drag"
  />
  <q-btn
    flat
    dense
    round
    icon="sym_r_close"
    aria-label="Close"
    @click="closeWindow"
    v-if="$q.platform.is.electron"
    class="webkit-no-drag"
  />
</template>
<script setup lang="ts">
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
