<template>
  <misc-layout :in-router="false" :show-dark-mode-toggle="true" v-if="show">
    <q-page class="startup-page">
      <div class="loading-container">
        <logo-component icon-class="logo pulse-animation" />
        <div class="label" v-if="mainStore.connectTries > 5">{{ $t("connecting") }}...</div>
      </div>
    </q-page>
  </misc-layout>
</template>
<script setup lang="ts">
import { isAxiosError } from "axios";
import { refreshToken } from "src/api/auth";
import LogoComponent from "src/components/misc/LogoComponent.vue";
import router from "src/router";
import { useMainStore } from "src/stores/main-store";
import { useProfileStore } from "src/stores/profile-store";
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from "vue";
import websockets from "src/utils/websockets";
import { websocketUrl } from "src/api/config";

const profileStore = useProfileStore();
const mainStore = useMainStore();

const MiscLayout = defineAsyncComponent(() => import("src/layouts/MiscLayout.vue"));
const show = ref(false);
let timeout: NodeJS.Timeout | null = null;

const toLogin = () => {
  mainStore.initialized = 1;
  void router.push({ path: "/login" });
};

const toApp = () => {
  mainStore.initialized = 2;
  void router.push({ path: "/app" });
};

const toInfo = () => {
  mainStore.initialized = 3;
  void router.push({ path: "/info" });
};

onMounted(async () => {
  timeout = setTimeout(() => {
    show.value = true;
  }, 250);
  if (!localStorage.getItem("first_start")) toInfo();
  else if (refreshToken()) {
    try {
      await profileStore.getProfile();
      websockets.connect(websocketUrl);
      toApp();
    } catch (e) {
      if (isAxiosError(e) && e.status == 401) {
        toLogin();
      } else {
        throw e;
      }
    }
  } else {
    toLogin();
  }
});
onBeforeUnmount(() => {
  if (timeout) clearTimeout(timeout);
});
</script>
