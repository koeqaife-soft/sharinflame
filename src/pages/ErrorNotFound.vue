<template>
  <div class="fullscreen">
    <div>
      <div style="font-size: 30vh">404</div>

      <div class="text-h2" style="opacity: 0.6">Oops. Nothing here...</div>

      <my-button type="primary" class="q-mt-xl" @click="$router.push({ path: '/' })" label="Go Home" />
    </div>
  </div>
</template>

<script setup lang="ts">
import MyButton from "src/components/my/MyButton.vue";
defineOptions({
  name: "ErrorNotFound"
});
</script>
<style scoped>
body {
  background-color: var(--background);
}

div {
  color: var(--on-background);
}

.my-button {
  display: flex;
  justify-self: center;
}
</style>
