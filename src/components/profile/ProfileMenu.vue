<template>
  <div class="container profile-menu-component">
    <q-btn :class="['open-profile', buttonsClass]" :key="user?.user_id || 0" unelevated no-caps @click="openUserDialog">
      <user-avatar :user="user!" />
      <div class="text-container">
        <div class="label text-body2">{{ $t("view_profile") }}</div>
        <div class="username text-caption">{{ `@${user?.username || "unknown"}` }}</div>
      </div>
    </q-btn>
    <q-btn
      :class="['dark-mode', buttonsClass]"
      icon="sym_r_dark_mode"
      :label="$t('dark_mode')"
      @click="$q.dark.toggle"
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
    <q-separator />
    <q-btn
      :class="['settings', buttonsClass]"
      icon="sym_r_settings"
      :label="$t('settings')"
      unelevated
      no-caps
      @click="emit('close-menu')"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch, defineAsyncComponent } from "vue";
import { useProfileStore } from "src/stores/profile-store";
import { useQuasar } from "quasar";
import MySwitch from "../misc/MySwitch.vue";

const UserAvatar = defineAsyncComponent(() => import("./UserAvatar.vue"));
const UserDialog = defineAsyncComponent(() => import("../dialogs/UserDialog.vue"));
const CreatePost = defineAsyncComponent(() => import("../dialogs/CreatePost.vue"));

const quasar = useQuasar();

const profileStore = useProfileStore();
const user = ref<User>();
const darkMode = ref(quasar.dark.isActive);

watch(darkMode, (v) => {
  quasar.dark.set(v);
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

function openUserDialog() {
  quasar.dialog({
    component: UserDialog,
    componentProps: {
      user: user.value
    }
  });
  emit("close-menu");
}

function createPost() {
  quasar.dialog({
    component: CreatePost,
    componentProps: {}
  });
  emit("close-menu");
}

defineProps<Props>();
onMounted(loadUser);
</script>
