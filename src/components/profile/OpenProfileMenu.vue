<template>
  <my-button class="profile webkit-no-drag">
    <user-avatar :me="true" />
    <q-menu class="menu-card" ref="menu">
      <profile-menu buttons-class="card-button" @close-menu="closeMenu" />
    </q-menu>
  </my-button>
</template>
<script setup lang="ts">
import { QMenu } from "quasar";
import { defineAsyncComponent, ref } from "vue";
import MyButton from "../my/MyButton.vue";

const ProfileMenu = defineAsyncComponent(() => import("./ProfileMenu.vue"));
const UserAvatar = defineAsyncComponent(() => import("./UserAvatar.vue"));

const menu = ref<QMenu>();

function closeMenu() {
  menu.value?.hide();
}
</script>
