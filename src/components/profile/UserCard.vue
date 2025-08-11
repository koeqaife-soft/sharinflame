<template>
  <div class="card user-card horizontal-container">
    <div class="avatar-container">
      <open-user-dialog :user="userRef" />
    </div>
    <div class="container name-container" @click="userDialog">
      <div class="display-name">{{ userRef.display_name || userRef.username }}</div>
      <div class="username">@{{ userRef.username }}</div>
    </div>
    <q-btn
      :label="userRef.followed ? $t('unfollow') : $t('follow')"
      no-caps
      unelevated
      icon="sym_r_add"
      class="follow-button"
      :class="userRef.followed ? 'outlined-button' : 'default-button'"
      @click="followButton"
    />
  </div>
</template>
<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";
import { follow, unfollow } from "src/api/users";
import { useQuasar } from "quasar";

const UserDialog = defineAsyncComponent(() => import("./UserDialog.vue"));
const OpenUserDialog = defineAsyncComponent(() => import("./OpenUserDialog.vue"));

const quasar = useQuasar();

const props = defineProps<{
  user: User;
}>();

const userRef = ref(props.user);

async function followButton() {
  const followed = userRef.value.followed;
  try {
    if (followed) {
      delete userRef.value.followed;
      await unfollow(userRef.value.user_id);
    } else {
      userRef.value.followed = true;
      await follow(userRef.value.user_id);
    }
  } catch {
    if (followed) userRef.value.followed = true;
    else delete userRef.value.followed;
  }
}

function userDialog() {
  quasar.dialog({
    component: UserDialog,
    componentProps: {
      user: userRef
    }
  });
}
</script>
