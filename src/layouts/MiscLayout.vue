<template>
  <q-layout view="lHh Lpr lFf">
    <q-header unelevated :class="headersClass">
      <q-toolbar class="toolbar webkit-drag">
        <LogoComponent icon-class="icon" />
        <div class="webkit-drag title">SharinFlame</div>

        <q-space class="webkit-drag" />

        <div
          class="toolbar-default-actions align-center full-height"
          v-if="showDarkModeToggle || $q.platform.is.electron"
        >
          <my-button
            icon="dark_mode"
            aria-label="DarkMode"
            @click="$q.dark.toggle()"
            class="webkit-no-drag"
            v-if="showDarkModeToggle"
          />

          <window-actions v-if="$q.platform.is.electron" />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view v-if="inRouter" />
      <slot v-if="!inRouter" />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import LogoComponent from "src/components/misc/LogoComponent.vue";
import MyButton from "src/components/my/MyButton.vue";
import { defineAsyncComponent } from "vue";

const WindowActions = defineAsyncComponent(() => import("src/components/WindowActions.vue"));

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
