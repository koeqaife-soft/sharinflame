<template>
  <button
    class="my-item"
    :class="[{ disabled: disable, loading, clickable }]"
    @click.stop="(payload) => !disable && emit('click', payload)"
    :disable="disable ?? false"
  >
    <slot />
    <span>
      <template v-if="icon">
        <my-icon :icon="icon" class="icon-left" />
      </template>
      <span v-if="label" class="my-item-label">{{ label }}</span>
      <template v-if="iconRight">
        <my-icon :icon="iconRight" class="icon-right" />
      </template>
    </span>
  </button>
</template>
<script setup lang="ts">
import MyIcon from "src/components/my/MyIcon.vue";

withDefaults(
  defineProps<{
    label?: string | undefined;
    icon?: string | undefined;
    iconRight?: string | undefined;
    loading?: boolean;
    clickable?: boolean;
    disable?: boolean | undefined;
  }>(),
  {
    loading: false,
    disable: false,
    clickable: false
  }
);

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();
</script>
