<template>
  <my-button class="profile webkit-no-drag is-icon" @click.stop="openDialog">
    <user-avatar :user="user" />
  </my-button>
</template>
<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import MyButton from "../my/MyButton.vue";
import { useMainStore } from "src/stores/main-store";

const mainStore = useMainStore();

const UserAvatar = defineAsyncComponent(() => import("./UserAvatar.vue"));

const props = defineProps<{
  user: User;
}>();

function openDialog() {
  mainStore.openDialog("user", props.user.user_id, { user: props.user });
}
</script>
