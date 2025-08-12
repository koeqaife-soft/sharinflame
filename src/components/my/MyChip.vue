<template>
  <button
    class="my-chip"
    :class="{ disabled: disable, loading, clickable }"
    @click="(payload) => emit('click', payload)"
    :disable="disable ?? false"
  >
    <slot />
    <span>
      <template v-if="icon">
        <my-icon :icon="icon" class="icon-left" />
      </template>
      <span v-if="label" class="my-chip-label">{{ label }}</span>
      <template v-if="iconRight">
        <my-icon :icon="iconRight" class="icon-right" />
      </template>
      <template v-if="removable">
        <my-button icon="close" class="btn-remove" @click.stop="emit('remove')" />
      </template>
    </span>
  </button>
</template>
<script setup lang="ts">
import MyIcon from "src/components/my/MyIcon.vue";
import MyButton from "src/components/my/MyButton.vue";

withDefaults(
  defineProps<{
    label?: string | undefined;
    icon?: string | undefined;
    iconRight?: string | undefined;
    loading?: boolean;
    clickable?: boolean;
    disable?: boolean | undefined;
    removable?: boolean;
  }>(),
  {
    loading: false,
    disable: false,
    clickable: false,
    removable: false
  }
);

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
  (e: "remove"): void;
}>();
</script>
