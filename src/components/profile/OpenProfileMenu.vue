<template>
  <q-btn class="profile webkit-no-drag" round flat>
    <user-avatar :me="true" />
    <q-menu class="menu-card" ref="menu">
      <profile-menu buttons-class="card-button" @close-menu="closeMenu" />
    </q-menu>
  </q-btn>
</template>
<script setup lang="ts">
import { QMenu } from "quasar";
import { defineAsyncComponent, ref } from "vue";

const ProfileMenu = defineAsyncComponent(() => import("./ProfileMenu.vue"));
const UserAvatar = defineAsyncComponent(() => import("./UserAvatar.vue"));

const menu = ref<QMenu>();

function closeMenu() {
  menu.value?.hide();
}
</script>
