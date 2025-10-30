<template>
  <q-page class="chat-view">
    <div class="container sidebar">
      <div class="channels">
        <my-button
          v-for="channel in channelsSorted"
          :key="channel.channel_id"
          type="card"
          is-category
          class="channel"
          :class="[channel.type, { selected: channel.channel_id == currentChannel }]"
          @click="currentChannel = channel.channel_id"
        >
          <template v-if="channel.type == 'direct'">
            <user-avatar :user="channel.members[0]" />
            <div class="channel-name">{{ channel.members[0]?.display_name ?? channel.members[0]?.username }}</div>
          </template>
        </my-button>
      </div>
    </div>
    <div class="chat">
      <!-- TODO -->
    </div>
  </q-page>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import MyButton from "src/components/my/MyButton.vue";
import UserAvatar from "src/components/profile/UserAvatar.vue";
import { getChannels } from "src/api/chat";

const channels = ref<UserChannel[]>([]);
const currentChannel = ref<string>();
const channelsSorted = computed(() => {
  return channels.value.toSorted((a, b) => a.last_read_at - b.last_read_at);
});

async function sync() {
  const r = await getChannels();
  channels.value = r.data.data.channels;
}

onMounted(() => {
  void sync();
});
</script>
