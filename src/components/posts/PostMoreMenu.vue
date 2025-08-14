<template>
  <div role="list" style="min-width: 230px">
    <template v-for="(option, index) in options" :key="index">
      <my-item
        v-if="option.visible && option.type === 'item'"
        :disable="option.disable ?? false"
        :clickable="true"
        v-close-popup
        @click="emit('action', option.key!, option.data)"
      >
        <div class="horizontal-container">
          <my-icon :icon="option.icon!" class="icon" />
          <div class="text">{{ $t(`post_options.${option.key}`) }}</div>
        </div>
      </my-item>
      <q-separator v-else-if="option.visible && option.type === 'separator'" class="separator" />
      <my-item v-else-if="option.visible && option.type === 'label'">
        <div class="horizontal-container">
          <my-icon :icon="option.icon!" class="icon" />
          <div class="container label-container">
            <div class="text">{{ $t(`comment_options.${option.key}`) }}</div>
            <div class="description">{{ option.description }}</div>
          </div>
        </div>
      </my-item>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useProfileStore } from "src/stores/profile-store";
import { computed } from "vue";
import MyItem from "src/components/my/MyItem.vue";
import MyIcon from "src/components/my/MyIcon.vue";
import { formatUnixTime } from "src/utils/format";
import { useI18n } from "vue-i18n";

const profileStore = useProfileStore();
const i18n = useI18n();

const emit = defineEmits<{
  (e: "action", key: string, data?: string): void;
}>();

const props = defineProps<{
  post: Post;
}>();
const options = computed(() => [
  {
    key: "edit",
    icon: "edit",
    visible: props.post.user_id == profileStore.profile?.user_id,
    disable: !(Date.now() / 1000 - props.post.created_at < 86400),
    type: "item"
  },
  {
    key: "delete",
    icon: "delete_forever",
    visible: props.post.user_id == profileStore.profile?.user_id,
    type: "item"
  },
  {
    key: "report",
    icon: "report",
    visible: true,
    type: "item"
  },
  {
    type: "separator",
    visible: true
  },
  {
    key: "copy_id",
    icon: "content_copy",
    visible: true,
    type: "item",
    data: props.post.post_id
  },
  {
    type: "label",
    key: "created_at",
    visible: true,
    icon: "access_time",
    description: formatUnixTime(props.post.created_at, i18n.locale.value)
  }
]);
</script>
