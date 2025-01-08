<template>
  <q-list style="min-width: 230px">
    <template v-for="(option, index) in options" :key="index">
      <q-item
        v-if="option.visible && option.type === 'item'"
        clickable
        v-close-popup
        @click="emit('action', option.key!, option.data)"
      >
        <q-item-section>
          <div class="horizontal-container">
            <q-icon :name="option.icon" class="icon" />
            <div class="text">{{ $t(`post_options.${option.key}`) }}</div>
          </div>
        </q-item-section>
      </q-item>
      <q-separator v-else-if="option.visible && option.type === 'separator'" class="separator" />
    </template>
  </q-list>
</template>

<script setup lang="ts">
import { useProfileStore } from "src/stores/profile-store";
import { computed } from "vue";

const profileStore = useProfileStore();

const emit = defineEmits<{
  (e: "action", key: string, data?: string): void;
}>();

const props = defineProps<{
  post: Post;
}>();
const options = computed(() => [
  {
    key: "delete",
    icon: "sym_r_delete_forever",
    visible: props.post.user_id == profileStore.profile?.user_id,
    type: "item"
  },
  {
    key: "report",
    icon: "sym_r_report",
    visible: true,
    type: "item"
  },
  {
    type: "separator",
    visible: true
  },
  {
    key: "copy_id",
    icon: "sym_r_content_copy",
    visible: true,
    type: "item",
    data: props.post.post_id
  }
]);
</script>
