<template>
  <div class="container profile-menu-component">
    <q-btn :class="['open-profile', buttonsClass]" :key="user?.user_id || 0" unelevated no-caps @click="openUserDialog">
      <user-avatar :user="user!" />
      <div class="text-container">
        <div class="label">{{ $t("view_profile") }}</div>
        <div class="username">{{ `@${user?.username || "unknown"}` }}</div>
      </div>
    </q-btn>
    <q-btn
      :class="['dark-mode', buttonsClass]"
      icon="sym_r_dark_mode"
      :label="$t('dark_mode')"
      @click="darkMode = !darkMode"
      unelevated
      no-caps
    >
      <my-switch v-model="darkMode" />
    </q-btn>
    <q-btn
      :class="['create-post', buttonsClass]"
      icon="sym_r_add_circle"
      :label="$t('create_post')"
      @click="createPost"
      unelevated
      no-caps
    />
    <q-btn
      :class="['my-activity', buttonsClass]"
      icon="sym_r_browse_activity"
      :label="$t('my_activity')"
      @click="openMyActivity"
      unelevated
      no-caps
    />
    <q-separator />
    <q-btn
      :class="['settings', buttonsClass]"
      icon="sym_r_settings"
      :label="$t('settings')"
      unelevated
      no-caps
      @click="openSettings"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch, defineAsyncComponent, type Component } from "vue";
import { useProfileStore } from "src/stores/profile-store";
import { useQuasar } from "quasar";
import MySwitch from "../misc/MySwitch.vue";
import UserAvatar from "./UserAvatar.vue";
import { useMainStore } from "src/stores/main-store";

const UserDialog = defineAsyncComponent(() => import("./UserDialog.vue"));
const PostEditor = defineAsyncComponent(() => import("../posts/PostEditor.vue"));
const MyActivity = defineAsyncComponent(() => import("../my-activity/MyActivityDialog.vue"));
const SettingsDialog = defineAsyncComponent(() => import("../settings/SettingsDialog.vue"));

const quasar = useQuasar();

const mainStore = useMainStore();
const profileStore = useProfileStore();
const user = ref<User>();
const darkMode = ref(quasar.dark.isActive);

watch(darkMode, (v) => {
  if (quasar.dark.isActive != v) {
    quasar.dark.set(v);
    mainStore.setSettings("darkMode", quasar.dark.mode);
  }
});

watch(
  () => quasar.dark.isActive,
  (v) => {
    darkMode.value = v;
  }
);

async function loadUser() {
  user.value = await profileStore.getProfile();
}

interface Props {
  buttonsClass: string;
}

const emit = defineEmits<{
  (e: "close-menu"): void;
}>();

function openDialog(component: Component, props: unknown) {
  quasar.dialog({
    component: component,
    componentProps: props
  });
  emit("close-menu");
}

const openUserDialog = () => openDialog(UserDialog, { user: user.value });
const openMyActivity = () => openDialog(MyActivity, {});
const createPost = () => openDialog(PostEditor, {});
const openSettings = () => openDialog(SettingsDialog, {});

defineProps<Props>();
onMounted(loadUser);
</script>
