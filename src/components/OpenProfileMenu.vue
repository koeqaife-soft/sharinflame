<template>
  <q-btn class="profile webkit-no-drag" round flat>
    <user-avatar :me="true" />
    <q-menu class="menu-card">
      <profile-menu buttons-class="card-button" />
    </q-menu>
  </q-btn>
</template>
<script setup lang="ts">
import ProfileMenu from "./ProfileMenu.vue";
import UserAvatar from "./UserAvatar.vue";
</script>
