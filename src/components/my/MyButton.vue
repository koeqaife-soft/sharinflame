<template>
  <button
    class="my-button"
    :title="title"
    :type="btnType ?? 'button'"
    :class="[
      {
        disabled: disable,
        loading,
        'is-category': isCategory,
        'is-icon': !label && (icon || iconRight),
        'tap-active': tap
      },
      `is-${type}`
    ]"
    @click.stop="(payload) => !disable && emit('click', payload)"
    :disable="disable ?? false"
    @touchstart.passive="onTap"
  >
    <slot />
    <span v-if="icon || label || iconRight || $slots['append']">
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
import { onBeforeUnmount, ref } from "vue";

withDefaults(
  defineProps<{
    label?: string | undefined;
    icon?: string | undefined;
    iconRight?: string | undefined;
    loading?: boolean;
    disable?: boolean | undefined;
    type?: "primary" | "secondary" | "outlined" | "card" | "none" | "attention" | "flat";
    isCategory?: boolean;
    btnType?: "button" | "submit" | "reset";
    title?: string;
  }>(),
  {
    type: "none",
    loading: false,
    disable: false,
    isCategory: false,
    btnType: "button"
  }
);

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const tap = ref(false);
let timeout: NodeJS.Timeout | null = null;

function onTap() {
  if (timeout) clearTimeout(timeout);
  tap.value = true;
  timeout = setTimeout(() => (tap.value = false), 250);
}

onBeforeUnmount(() => {
  if (timeout) clearTimeout(timeout);
});
</script>
