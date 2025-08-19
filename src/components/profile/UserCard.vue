<template>
  <div class="card user-card horizontal-container">
    <div class="avatar-container">
      <open-user-dialog :user="userRef" />
    </div>
    <div class="container name-container" @click="userDialog">
      <div class="display-name">{{ userRef.display_name || userRef.username }}</div>
      <div class="username">@{{ userRef.username }}</div>
    </div>
    <my-button
      :label="userRef.followed ? $t('unfollow') : $t('follow')"
      no-caps
      unelevated
      icon="add"
      class="follow-button"
      :type="userRef.followed ? 'outlined' : 'primary'"
      @click="followButton"
    />
  </div>
</template>
<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";
import { follow, unfollow } from "src/api/users";
import MyButton from "../my/MyButton.vue";
import { useMainStore } from "src/stores/main-store";

const OpenUserDialog = defineAsyncComponent(() => import("./OpenUserDialog.vue"));

const mainStore = useMainStore();

const props = defineProps<{
  user: User;
}>();

const userRef = ref(props.user);

async function followButton() {
  const followed = userRef.value.followed;
  try {
    if (followed) {
      delete userRef.value.followed;
      await unfollow(userRef.value.user_id);
    } else {
      userRef.value.followed = true;
      await follow(userRef.value.user_id);
    }
  } catch {
    if (followed) userRef.value.followed = true;
    else delete userRef.value.followed;
  }
}

function userDialog() {
  mainStore.openDialog("user", userRef.value.user_id, { user: userRef.value });
}
</script>
