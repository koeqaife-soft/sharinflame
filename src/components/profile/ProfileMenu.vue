<template>
  <div class="container profile-menu-component">
    <my-button type="card" :class="['open-profile', buttonsClass]" :key="user?.user_id || 0" @click="openUserDialog">
      <user-avatar :user="user!" />
      <div class="text-container">
        <div class="label">{{ $t("view_profile") }}</div>
        <div class="username">{{ `@${user?.username || "unknown"}` }}</div>
      </div>
    </my-button>
    <my-button
      type="card"
      :class="['dark-mode', buttonsClass]"
      icon="dark_mode"
      :label="$t('dark_mode')"
      @click="darkMode = !darkMode"
    >
      <template v-slot:append>
        <my-switch v-model="darkMode" />
      </template>
    </my-button>
    <my-button
      type="card"
      :class="['create-post', buttonsClass]"
      icon="add_circle"
      :label="$t('create_post')"
      @click="createPost"
      unelevated
      no-caps
    />
    <my-button
      type="card"
      :class="['my-activity', buttonsClass]"
      icon="browse_activity"
      :label="$t('my_activity')"
      @click="openMyActivity"
      unelevated
      no-caps
    />
    <q-separator />
    <my-button
      type="card"
      :class="['settings', buttonsClass]"
      icon="settings"
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
import MySwitch from "../my/MySwitch.vue";
import MyButton from "../my/MyButton.vue";
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
