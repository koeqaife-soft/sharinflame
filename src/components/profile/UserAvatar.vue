<template>
  <div ref="avatarRef" class="avatar" :key="userRef?.user_id || 0">
    <div class="avatar-content">
      <template v-if="userRef?.avatar_url">
        <my-image :src="userRef?.avatar_url" />
      </template>
      <template v-else>
        {{ userRef?.username.charAt(0).toUpperCase() }}
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import MyImage from "../my/MyImage.vue";
import { useProfileStore } from "src/stores/profile-store";
import { onMounted, ref, watch } from "vue";

interface Props {
  user?: User | undefined;
  me?: boolean;
}
const props = defineProps<Props>();

const profileStore = useProfileStore();
const userRef = ref<User>();
const avatarRef = ref<HTMLElement | null>(null);

async function loadUser() {
  userRef.value = await profileStore.getProfile();
}

function onLoad() {
  if (props.user) userRef.value = props.user;
  else if (props.me) void loadUser();
}

watch(props, onLoad);

onMounted(onLoad);
</script>
