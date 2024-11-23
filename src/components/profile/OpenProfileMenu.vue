<template>
  <q-btn class="profile webkit-no-drag" round flat>
    <user-avatar :me="true" />
    <q-menu class="menu-card">
      <profile-menu buttons-class="card-button" />
    </q-menu>
  </q-btn>
</template>
<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const ProfileMenu = defineAsyncComponent(() => import("./ProfileMenu.vue"));
const UserAvatar = defineAsyncComponent(() => import("./UserAvatar.vue"));
</script>
