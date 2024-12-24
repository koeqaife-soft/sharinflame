<template>
  <q-btn
    :icon="icon"
    :label="label"
    :class="['card-button', { selected: selected }, 'category-button']"
    :disable="disabled"
    @click="handleClick"
    unelevated
    no-caps
  />
</template>
<script setup lang="ts">
export interface ButtonProps {
  label: string;
  icon: string;
  selected?: boolean;
  click: () => void;
  type?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<ButtonProps>(), {
  icon: "",
  label: "",
  selected: false,
  disabled: false
});

const handleClick = () => {
  props.click();
};
</script>
