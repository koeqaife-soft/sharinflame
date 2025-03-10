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
            <div class="text">{{ $t(`comment_options.${option.key}`) }}</div>
          </div>
        </q-item-section>
      </q-item>
      <q-separator v-else-if="option.visible && option.type === 'separator'" class="separator" />
      <q-item v-if="option.visible && option.type === 'label'">
        <q-item-section>
          <div class="horizontal-container">
            <q-icon :name="option.icon" class="icon" />
            <div class="container label-container">
              <div class="text">{{ $t(`comment_options.${option.key}`) }}</div>
              <div class="description">{{ option.description }}</div>
            </div>
          </div>
        </q-item-section>
      </q-item>
    </template>
  </q-list>
</template>

<script setup lang="ts">
import { useProfileStore } from "src/stores/profile-store";
import { computed } from "vue";
import { formatUnixTime } from "src/utils/format";
import { useI18n } from "vue-i18n";

const i18n = useI18n();
const profileStore = useProfileStore();

const emit = defineEmits<{
  (e: "action", key: string, data?: string): void;
}>();

const props = defineProps<{
  comment: Comment | CommentWithUser;
}>();
const options = computed(() => [
  {
    key: "delete",
    icon: "sym_r_delete_forever",
    visible: props.comment.user_id == profileStore.profile?.user_id,
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
    data: props.comment.comment_id
  },
  {
    type: "label",
    key: "created_at",
    visible: true,
    icon: "sym_r_access_time",
    description: formatUnixTime(props.comment.created_at, i18n.locale.value)
  }
]);
</script>
