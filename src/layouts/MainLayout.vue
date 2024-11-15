<template>
  <q-layout view="lHh Lpr lFf">
    <q-header unelevated :class="headersClass">
      <q-toolbar class="toolbar webkit-drag">
        <slot name="toolbar-before-logo" />
        <LogoComponent @icon-click="logoClick" :is-animated="isIconAnimated" icon-class="icon" class="webkit-no-drag" />

        <q-btn unelevated no-caps class="webkit-no-drag title-button" v-if="$slots['logo-menu']">
          <div class="title in-button">SharinFlame</div>
          <slot name="logo-menu" />
          <q-icon name="sym_r_arrow_drop_up" :class="['open-menu', { active: menuOpened }]" />
        </q-btn>
        <div v-else class="webkit-drag title ellipsis">SharinFlame</div>

        <q-space class="webkit-drag" />

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
import { onBeforeUnmount, ref, defineAsyncComponent } from "vue";

const WindowActions = defineAsyncComponent(() => import("src/components/WindowActions.vue"));

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
    menuOpened?: boolean;
    headersClass?: string;
  }>(),
  {
    showDarkModeToggle: false,
    inRouter: true
  }
);
</script>
