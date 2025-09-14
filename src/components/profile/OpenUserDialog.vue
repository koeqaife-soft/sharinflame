<template>
  <my-button class="profile webkit-no-drag is-icon" @click.stop="openDialog">
    <user-avatar :user="user" />
  </my-button>
</template>
<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import MyButton from "../my/MyButton.vue";
import { useMainStore } from "src/stores/main-store";
import { useProfileStore } from "src/stores/profile-store";

const mainStore = useMainStore();
const profileStore = useProfileStore();

const UserAvatar = defineAsyncComponent(() => import("./UserAvatar.vue"));

const props = defineProps<{
  user: User;
}>();

function hasChanges(saved: User, current: User): boolean {
  const keys = ["username", "display_name", "avatar_url"] as const;
  for (const key of keys) {
    if (saved[key] !== current[key]) {
      return true;
    }
  }
  return false;
}

function openDialog() {
  const saved = profileStore.profiles[props.user.user_id]?.data;
  if (saved && hasChanges(saved, props.user)) {
    delete profileStore.profiles[props.user.user_id];
  }
  mainStore.openDialog("user", props.user.user_id, { user: props.user });
}
</script>
