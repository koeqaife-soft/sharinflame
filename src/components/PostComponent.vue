<template>
  <q-card class="post card" unelevated>
    <q-card-section>
      <q-avatar class="avatar">
        <template v-if="post.user.avatar_url">
          <img :src="post.user.avatar_url" />
        </template>
        <template v-else>
          {{ post.user.username.charAt(0).toUpperCase() }}
        </template>
      </q-avatar>
      <div class="username">{{ post.user.display_name || post.user.username }}</div>
    </q-card-section>
    <q-separator inset />
    <q-card-section>
      <div class="content">{{ post.content }}</div>
    </q-card-section>
  </q-card>
</template>
<script setup lang="ts">
defineProps<{
  post: Post;
}>();
</script>
