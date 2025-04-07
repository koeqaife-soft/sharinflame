<template>
  <div class="card toggle-value">
    <div class="horizontal-container">
      <q-icon v-if="icon" :name="icon" class="icon" />
      <template v-if="!showDescription">
        <div>{{ info.label }}</div>
      </template>
      <div v-else class="container">
        <div class="label">{{ info.label }}</div>
        <div class="description">{{ info.description }}</div>
      </div>
      <q-space />
      <my-switch v-model="model!" />
    </div>
  </div>
</template>
<script setup lang="ts">
import MySwitch from "src/components/misc/MySwitch.vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const i18n = useI18n();
const { t } = i18n;

const props = withDefaults(
  defineProps<{
    labelKey: string;
    icon?: string;
    showDescription?: boolean;
  }>(),
  {
    showDescription: true
  }
);
const model = defineModel<boolean>();

const info = computed(() => ({
  label: t(`${props.labelKey}.label`),
  description: props.showDescription ? t(`${props.labelKey}.desc`) : undefined
}));
</script>
