<template>
  <div class="segmented-button">
    <q-btn
      unelevated
      no-caps
      v-for="item in items"
      :key="item.key"
      :label="item.label ?? $t(item.labelKey)"
      class="button category-button"
      :class="{ selected: item.key === model }"
      :icon="item.iconLeft"
      :icon-right="item.iconRight"
      @click="select(item)"
    />
  </div>
</template>
<script setup lang="ts">
interface ItemWithLabel {
  label: string;
  labelKey?: never;
}

interface ItemWithLabelKey {
  labelKey: string;
  label?: never;
}

type Item = (ItemWithLabel | ItemWithLabelKey) & {
  iconLeft?: string;
  iconRight?: string;
  key: string;
};

defineProps<{
  items: Item[];
}>();

const model = defineModel<string>();

const select = (item: Item) => (model.value = item.key);
</script>
