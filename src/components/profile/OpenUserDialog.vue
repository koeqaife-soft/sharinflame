<template>
  <q-btn class="profile webkit-no-drag" round flat @click="openDialog">
    <user-avatar :user="user" />
  </q-btn>
</template>
<script setup lang="ts">
import { useQuasar } from "quasar";
import { defineAsyncComponent } from "vue";

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
