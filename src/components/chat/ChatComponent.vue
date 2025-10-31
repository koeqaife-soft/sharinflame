<template>
  <div class="chat-component">
    <template v-if="channel.type == 'direct'">
      <user-avatar :user="channel.members[0]" />
      <div class="channel-name">
        {{ channel.members[0]?.display_name ?? channel.members[0]?.username }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import UserAvatar from "../profile/UserAvatar.vue";

defineProps<{
  channel: UserChannel;
}>();
</script>
