<template>
  <q-card class="card toggle-value">
    <div class="horizontal-container">
      <q-icon v-if="icon" :name="icon" class="icon" />
      <template v-if="!description">
        <div>{{ label }}</div>
      </template>
      <div v-else class="container">
        <div class="label">{{ label }}</div>
        <div class="description">{{ description }}</div>
      </div>
      <q-space />
      <my-switch v-model="model" />
    </div>
  </q-card>
</template>
<script setup lang="ts">
import MySwitch from "src/components/misc/MySwitch.vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  t_key: string;
  show_description?: boolean;
  icon?: string;
}>();
const model = defineModel<boolean>();

const label = computed(() => t(`tag.${props.t_key}_label`));
const description = computed(() => (!props.show_description ? t(`tag.${props.t_key}_desc`) : undefined));
</script>
