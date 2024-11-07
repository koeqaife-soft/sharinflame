<template>
  <div class="container profile-menu-component">
    <q-btn :class="['open-profile', buttonsClass]" :key="user?.user_id || 0" unelevated no-caps>
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
      <q-toggle v-model="darkMode" />
    </q-btn>
    <q-btn
      :class="['create-post', buttonsClass]"
      icon="sym_r_add_circle"
      :label="$t('create_post')"
      unelevated
      no-caps
    />
    <q-separator />
    <q-btn :class="['settings', buttonsClass]" icon="sym_r_settings" :label="$t('settings')" unelevated no-caps />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import UserAvatar from "./UserAvatar.vue";
import { useProfileStore } from "src/stores/profile-store";
import { useQuasar } from "quasar";

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

defineProps<Props>();
onMounted(loadUser);
</script>
