<template>
  <div class="container profile-menu-component">
    <my-button
      type="card"
      :class="['open-profile', buttonsClass]"
      :key="user?.user_id || 0"
      @click="openDialog('user', user!.user_id, { user: user })"
      v-close-popup
    >
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
      @click="mainStore.openDialog('postEditor', '', {})"
      v-close-popup
    />
    <my-button
      type="card"
      :class="['my-activity', buttonsClass]"
      icon="browse_activity"
      :label="$t('my_activity')"
      @click="mainStore.openDialog('myActivity', '', {})"
      v-close-popup
    />
    <q-separator />
    <my-button
      type="card"
      :class="['settings', buttonsClass]"
      icon="settings"
      :label="$t('settings')"
      v-close-popup
      @click="mainStore.openDialog('settings', '', {})"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useProfileStore } from "src/stores/profile-store";
import { useQuasar } from "quasar";
import MySwitch from "../my/MySwitch.vue";
import MyButton from "../my/MyButton.vue";
import UserAvatar from "./UserAvatar.vue";
import { useMainStore } from "src/stores/main-store";

const quasar = useQuasar();

const mainStore = useMainStore();
const profileStore = useProfileStore();
const user = ref<User>();
const darkMode = ref(quasar.dark.isActive);

watch(darkMode, (v) => {
  if (quasar.dark.isActive != v) {
    quasar.dark.set(v);
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

function openDialog(...props: Parameters<typeof mainStore.openDialog>) {
  mainStore.openDialog(...props);
  emit("close-menu");
}

defineProps<Props>();
onMounted(loadUser);
</script>
