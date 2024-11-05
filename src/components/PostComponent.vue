<template>
  <q-card class="post card" unelevated>
    <q-card-section>
      <user-avatar :user="post.user" />
      <div class="text-container">
        <div class="username">{{ post.user.display_name || post.user.username }}</div>
        <div class="content wrap-text">{{ post.content }}</div>
      </div>
    </q-card-section>
  </q-card>
</template>
<script setup lang="ts">
import UserAvatar from "./UserAvatar.vue";
defineProps<{
  post: Post;
}>();
</script>
