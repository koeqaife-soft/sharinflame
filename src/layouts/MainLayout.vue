<template>
  <q-layout view="lHh Lpr lFf">
    <q-header unelevated :class="[headersClass, { 'use-alt': mainStore.settings.toolbarUseAlt }]">
      <q-toolbar class="toolbar webkit-drag">
        <slot name="toolbar-before-logo" />
        <LogoComponent @icon-click="logoClick" :is-animated="isIconAnimated" icon-class="icon" class="webkit-no-drag" />

        <my-button class="webkit-no-drag title-button" v-if="$slots['logo-menu']">
          <div class="title in-button">SharinFlame</div>
          <slot name="logo-menu" />
          <my-icon icon="arrow_drop_up" :class="['menu-arrow', { active: menuOpened }]" />
        </my-button>
        <div v-else class="webkit-drag title">SharinFlame</div>

        <slot name="before-space" />
        <q-space class="webkit-drag" />
        <slot name="after-space" />

        <div
          class="horizontal-container full-height align-center"
          v-if="$slots['toolbar-actions'] || showDarkModeToggle || $q.platform.is.electron"
        >
          <div class="toolbar-actions" v-if="$slots['toolbar-actions']">
            <slot name="toolbar-actions" />
          </div>

          <div class="toolbar-default-actions" v-if="showDarkModeToggle || $q.platform.is.electron">
            <my-button
              icon="dark_mode"
              aria-label="DarkMode"
              @click="$q.dark.toggle()"
              class="webkit-no-drag"
              v-if="showDarkModeToggle"
            />

            <window-actions v-if="$q.platform.is.electron" />
          </div>
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
import { onBeforeUnmount, ref, defineAsyncComponent } from "vue";
import MyButton from "src/components/my/MyButton.vue";
import MyIcon from "src/components/my/MyIcon.vue";
import { useRouter } from "vue-router";
import { useMainStore } from "src/stores/main-store";

const WindowActions = defineAsyncComponent(() => import("src/components/WindowActions.vue"));

const mainStore = useMainStore();
const router = useRouter();

const isIconAnimated = ref(false);
let animationTimeout: ReturnType<typeof setTimeout>;
let clickCount = 0;

function logoClick() {
  if (animationTimeout) {
    clearTimeout(animationTimeout);
    clickCount++;
  }

  if (router.currentRoute.value.path === "/cat") {
    void router.back();
    return;
  }
  if (clickCount >= 3) {
    void router.push({ path: "/cat" });
    return;
  }

  isIconAnimated.value = true;

  animationTimeout = setTimeout(() => {
    isIconAnimated.value = false;
    clickCount = 0;
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
