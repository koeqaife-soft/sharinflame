<template>
  <q-dialog
    v-model="offlineDialog"
    persistent
    seamless
    :maximized="true"
    transition-show="fade"
    transition-hide="fade"
    class="offline-dialog index-10000"
  >
    <main-layout :in-router="false" :show-dark-mode-toggle="true" class="layout">
      <div class="_container">
        <logo-component icon-class="logo" />
        <div class="label">{{ $t("connecting") }}...</div>
      </div>
    </main-layout>
  </q-dialog>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, ref, watch, defineAsyncComponent, onBeforeMount } from "vue";
import { useMainStore } from "./stores/main-store";
import { api, apiEndpoints } from "./boot/axios";
import { generateAll, setCss } from "./utils/colors";

const LogoComponent = defineAsyncComponent(() => import("./components/misc/LogoComponent.vue"));
const MainLayout = defineAsyncComponent(() => import("./layouts/MainLayout.vue"));

const mainStore = useMainStore();
const offlineDialog = ref(true);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function ping() {
  await delay(Math.random());
  try {
    await api.post(apiEndpoints.ping);
  } catch {
    mainStore.connectTries += 1;
  }
}

function waitTime() {
  const time = Math.max(mainStore.connectTries - 4, 1) * 2;
  return Math.min(25, time);
}

async function pingInterval() {
  await ping();
  while (true) {
    if (mainStore.isOffline) {
      await delay(waitTime() * 1000);
      await ping();
    }
    await delay(500);
  }
}

function onChange() {
  if (mainStore.isOffline) {
    if (mainStore.connectTries >= 5) offlineDialog.value = true;
    else offlineDialog.value = false;
  } else {
    offlineDialog.value = false;
    mainStore.connectTries = 0;
  }
}

watch(
  () => mainStore.isOffline,
  () => onChange()
);

watch(
  () => mainStore.connectTries,
  () => onChange()
);

defineOptions({
  name: "App"
});

onMounted(() => {
  onChange();
  pingInterval();
});

onBeforeMount(() => {
  const colors = generateAll([8, 0, 0]);
  setCss(colors);
});
</script>
