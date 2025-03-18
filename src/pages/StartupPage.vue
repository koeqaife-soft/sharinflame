<template>
  <q-page class="startup-page">
    <div class="loading-container">
      <logo-component icon-class="logo pulse-animation" />
      <div class="label" v-if="mainStore.connectTries > 5">{{ $t("connecting") }}...</div>
    </div>
  </q-page>
</template>
<script setup lang="ts">
import { isAxiosError } from "axios";
import { refreshToken } from "src/api/auth";
import LogoComponent from "src/components/misc/LogoComponent.vue";
import router from "src/router";
import { useMainStore } from "src/stores/main-store";
import { useProfileStore } from "src/stores/profile-store";
import { onMounted } from "vue";

const profileStore = useProfileStore();
const mainStore = useMainStore();

const toLogin = () => {
  mainStore.initialized = 1;
  void router.push({ path: "/login" });
};

const toApp = () => {
  mainStore.initialized = 2;
  void router.push({ path: "/app" });
};

onMounted(async () => {
  if (refreshToken()) {
    try {
      await profileStore.getProfile();
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
</script>
