<template>
  <div class="card notification" @click="onClicked">
    <div class="image-container">
      <open-user-dialog
        v-if="notif.linked_type == 'post' || notif.linked_type == 'comment'"
        :user="notif.loaded.user"
      />
      <q-icon v-if="notif.type == 'new_comment'" name="sym_r_comment" class="icon" />
    </div>
    <div class="text-container">
      <div class="title">{{ $t(`notifications.${notif.type}`, { username }) }}</div>
      <div class="message">{{ message }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuasar } from "quasar";
import { getPost } from "src/api/posts";
import { computed, defineAsyncComponent } from "vue";

const quasar = useQuasar();
const PostDialog = defineAsyncComponent(() => import("src/components/dialogs/PostDialog.vue"));
const OpenUserDialog = defineAsyncComponent(() => import("../dialogs/OpenUserDialog.vue"));

const username = computed(() => {
  if (!props.notif.loaded) return undefined;
  else {
    switch (props.notif.linked_type) {
      case "post":
        return props.notif.loaded.user.username;
      case "comment":
        return props.notif.loaded.user.username;
      default:
        return undefined;
    }
  }
});
const message = computed(() => {
  if (!props.notif.loaded) return props.notif.message;
  else {
    switch (props.notif.linked_type) {
      case "post":
        return props.notif.loaded.content;
      case "comment":
        return props.notif.loaded.content;
      default:
        return undefined;
    }
  }
});

async function onClicked() {
  if (props.notif.linked_type == "post") {
    quasar.dialog({
      component: PostDialog,
      componentProps: {
        post: props.notif.loaded
      }
    });
  } else if (props.notif.linked_type == "comment") {
    const post = await getPost(props.notif.loaded.post_id);
    if (post.data.success) {
      quasar.dialog({
        component: PostDialog,
        componentProps: {
          post: post.data.data,
          firstComment: props.notif.loaded,
          autoLoad: false
        }
      });
    }
  }
}

const props = defineProps<{
  notif: ApiNotification;
}>();
</script>
