<template>
  <my-button class="profile webkit-no-drag is-icon" @click="openDialog">
    <user-avatar :user="user" />
  </my-button>
</template>
<script setup lang="ts">
import { useQuasar } from "quasar";
import { defineAsyncComponent } from "vue";
import MyButton from "../my/MyButton.vue";

const quasar = useQuasar();

const UserAvatar = defineAsyncComponent(() => import("./UserAvatar.vue"));
const UserDialog = defineAsyncComponent(() => import("./UserDialog.vue"));

const props = defineProps<{
  user: User;
}>();

function openDialog() {
  quasar.dialog({
    component: UserDialog,
    componentProps: {
      user: props.user
    }
  });
}
</script>
