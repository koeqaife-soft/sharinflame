<template>
  <q-avatar class="avatar" :key="userRef?.user_id || 0">
    <template v-if="userRef?.avatar_url">
      <img :src="userRef?.avatar_url" />
    </template>
    <template v-else>
      {{ userRef?.username.charAt(0).toUpperCase() }}
    </template>
  </q-avatar>
</template>
<script setup lang="ts">
import { useProfileStore } from "src/stores/profile-store";
import { onMounted, ref } from "vue";

interface Props {
  user?: User | undefined;
  me?: boolean;
}
const props = defineProps<Props>();

const profileStore = useProfileStore();
const userRef = ref<User>();

async function loadUser() {
  userRef.value = await profileStore.getProfile();
}

onMounted(() => {
  if (props.user) userRef.value = props.user;
  else if (props.me) loadUser();
});
</script>
