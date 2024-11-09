<template>
  <q-layout view="lHh Lpr lFf">
    <q-header unelevated>
      <q-toolbar class="toolbar webkit-drag">
        <slot name="toolbar-before-logo" />
        <LogoComponent @icon-click="logoClick" :is-animated="isIconAnimated" icon-class="icon" class="webkit-no-drag" />

        <q-toolbar-title class="webkit-drag"> SharinFlame </q-toolbar-title>

        <slot name="toolbar-actions" />

        <q-btn
          flat
          dense
          round
          icon="sym_r_dark_mode"
          aria-label="DarkMode"
          @click="$q.dark.toggle()"
          class="webkit-no-drag"
          v-if="showDarkModeToggle"
        />
        <window-actions />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view v-if="inRouter" />
      <slot v-if="!inRouter" />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import LogoComponent from "src/components/LogoComponent.vue";
import WindowActions from "src/components/WindowActions.vue";
import { onBeforeUnmount, ref } from "vue";

const isIconAnimated = ref(false);
let animationTimeout: ReturnType<typeof setTimeout>;

function logoClick() {
  if (animationTimeout) {
    clearTimeout(animationTimeout);
  }

  isIconAnimated.value = true;

  animationTimeout = setTimeout(() => {
    isIconAnimated.value = false;
  }, 500);
}

onBeforeUnmount(() => {
  if (animationTimeout) {
    clearTimeout(animationTimeout);
  }
});

withDefaults(
  defineProps<{
    showDarkModeToggle?: boolean;
    inRouter?: boolean;
  }>(),
  {
    showDarkModeToggle: false,
    inRouter: true
  }
);
</script>
