<template>
  <div class="card toggle-value">
    <div class="horizontal-container">
      <q-icon v-if="icon" :name="icon" class="icon" />
      <template v-if="description == `${props.labelKey}.desc`">
        <div>{{ label }}</div>
      </template>
      <div v-else class="container">
        <div class="label">{{ label }}</div>
        <div class="description">{{ description }}</div>
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

const props = defineProps<{
  labelKey: string;
  icon?: string;
}>();
const model = defineModel<boolean>();

const label = computed(() => t(`${props.labelKey}.label`));
const description = computed(() => t(`${props.labelKey}.desc`));
</script>
