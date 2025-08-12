<template>
  <button
    class="my-button"
    :class="[
      { disabled: disable, loading, 'is-category': isCategory, 'is-icon': !label && (icon || iconRight) },
      `is-${type}`
    ]"
    @click="(payload) => emit('click', payload)"
    :disable="disable ?? false"
  >
    <slot />
    <span>
      <template v-if="icon">
        <my-icon :icon="icon" class="icon-left" />
      </template>
      <span v-if="label" class="my-button-label">{{ label }}</span>
      <slot name="append" />
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
    disable?: boolean | undefined;
    type?: "primary" | "secondary" | "outlined" | "card" | "none" | "item";
    isCategory?: boolean;
  }>(),
  {
    type: "none",
    loading: false,
    disable: false,
    isCategory: false
  }
);

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();
</script>
