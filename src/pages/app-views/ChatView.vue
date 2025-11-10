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
          :class="[channel.type, { selected: channel.channel_id == currentChannel?.channel_id }]"
          @click="setChannel(channel.channel_id)"
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
        <keep-alive>
          <component :is="ChatComponent" :key="currentChannel.members[0]?.user_id!" :channel="currentChannel" />
        </keep-alive>
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
import ChatComponent from "src/components/chat/ChatComponent.vue";
import { getChannels } from "src/api/chat";
import { useMainStore } from "src/stores/main-store";
import { useProfileStore } from "src/stores/profile-store";

defineProps<{
  isSmallScreen: boolean;
  isBigScreen: boolean;
}>();

const mainStore = useMainStore();
const profileStore = useProfileStore();

const channels = ref<UserChannel[]>([]);
const currentChannel = ref<UserChannel>();
const channelsSorted = computed(() => {
  return channels.value.toSorted((a, b) => a.last_read_at - b.last_read_at);
});

watch(
  () => mainStore.currentChat,
  (v) => {
    if (v == undefined) return;

    const channel = channels.value.find((c) => c.channel_id == v.channelId);
    if (channel) {
      currentChannel.value = channel;
    } else if (v.user) {
      currentChannel.value = {
        channel_id: "0",
        created_at: 0,
        joined_at: 0,
        last_read_at: 0,
        last_read_message_id: 0,
        members: [v.user],
        membership_id: "0",
        type: "direct",
        user_id: profileStore.profile!.user_id
      };
    } else {
      mainStore.currentChat = {};
    }
  }
);

function setChannel(id: string) {
  mainStore.currentChat = {
    channelId: id
  };
}

async function sync() {
  const r = await getChannels();
  channels.value = r.data.data.channels;
}

onMounted(() => {
  void sync();
});
</script>
