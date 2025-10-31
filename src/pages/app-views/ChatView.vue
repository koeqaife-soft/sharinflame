<template>
  <q-page class="chat-view" :class="{ 'is-small-screen': isSmallScreen, 'is-big-screen': isBigScreen }">
    <div class="container sidebar card">
      <div class="channels">
        <my-button
          v-for="channel in channelsSorted"
          :key="channel.channel_id"
          type="card"
          is-category
          class="channel"
          :class="[channel.type, { selected: channel.channel_id == currentChannelId }]"
          @click="currentChannelId = channel.channel_id"
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
      <template v-if="currentChannel">
        <div class="card chat-header">
          <template v-if="currentChannel.type == 'direct'">
            <user-avatar :user="currentChannel.members[0]" />
            <div class="channel-name">
              {{ currentChannel.members[0]?.display_name ?? currentChannel.members[0]?.username }}
            </div>
          </template>
        </div>
      </template>
      <template v-else>
        <div class="select-chat">{{ $t("select_chat") }}</div>
      </template>
    </div>
  </q-page>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import MyButton from "src/components/my/MyButton.vue";
import UserAvatar from "src/components/profile/UserAvatar.vue";
import { getChannels } from "src/api/chat";

defineProps<{
  isSmallScreen: boolean;
  isBigScreen: boolean;
}>();

const channels = ref<UserChannel[]>([]);
const currentChannelId = ref<string>();
const currentChannel = ref<UserChannel>();
const channelsSorted = computed(() => {
  return channels.value.toSorted((a, b) => a.last_read_at - b.last_read_at);
});

watch(currentChannelId, (v) => {
  if (v == undefined) return;

  const channel = channels.value.find((v) => v.channel_id == currentChannelId.value);
  if (channel) {
    currentChannel.value = channel;
  } else {
    currentChannelId.value = undefined;
  }
});

async function sync() {
  const r = await getChannels();
  channels.value = r.data.data.channels;
}

onMounted(() => {
  void sync();
});
</script>
