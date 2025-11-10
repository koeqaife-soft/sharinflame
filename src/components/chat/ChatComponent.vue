<template>
  <div class="chat-component">
    <div class="chat-header card">
      <template v-if="channel.type == 'direct'">
        <user-avatar :user="channel.members[0]" @click="openUserDialog" style="cursor: pointer" />
        <div class="channel-name" @click="openUserDialog" style="cursor: pointer">
          {{ channel.members[0]?.display_name ?? channel.members[0]?.username }}
        </div>
      </template>
    </div>
    <q-scroll-area class="fix-scroll-area full-height">
      <!--TODO-->
    </q-scroll-area>
    <div class="card user-input">
      <div class="card-section">
        <div class="horizontal-container align-end full-width">
          <q-input
            dense
            borderless
            rounded
            v-model="text"
            autogrow
            maxlength="1024"
            :label="$t('enter_message')"
            class="full-width enter-message"
            :disable="sending"
            @keydown.enter="sendMessage"
          />
          <my-button
            icon="send"
            class="send-button"
            @click="sendMessage"
            :loading="sending"
            :disable="text.length == 0"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMainStore } from "src/stores/main-store";
import UserAvatar from "../profile/UserAvatar.vue";
import MyButton from "../my/MyButton.vue";
import { onMounted, ref } from "vue";
import { createChannelAndMessage } from "src/api/chat";

const mainStore = useMainStore();

const text = ref("");
const sending = ref(false);

function openUserDialog() {
  mainStore.openDialog("user", props.channel.members[0]?.user_id ?? "", { user: props.channel.members[0] });
}

const props = defineProps<{
  channel: UserChannel;
}>();

async function sendMessage() {
  sending.value = true;
  await createChannelAndMessage(props.channel.members[0]!.user_id, text.value, undefined);
}

onMounted(() => console.log("MOUNTED"));
</script>
