<template>
  <q-avatar class="avatar" :key="user?.user_id || 0">
    <template v-if="user?.avatar_url">
      <img :src="user?.avatar_url" />
    </template>
    <template v-else>
      {{ user?.username.charAt(0).toUpperCase() }}
    </template>
  </q-avatar>
</template>
<script setup lang="ts">
interface Props {
  user: User | undefined;
}

defineProps<Props>();
</script>
