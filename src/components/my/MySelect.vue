<template>
  <my-button :label="currentCategory?.label" :icon="currentCategory?.icon" :is-category="true" type="card">
    <q-menu class="categories-menu menu-card" v-model="categoriesMenuOpened">
      <category-buttons :categories-list="optionsList" :current-type="model ?? ''" />
    </q-menu>
    <template #append>
      <my-icon icon="arrow_drop_up" :class="['menu-arrow', { active: categoriesMenuOpened }]" />
    </template>
  </my-button>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import CategoryButtons from "../misc/CategoryButtons.vue";
import MyButton from "./MyButton.vue";
import MyIcon from "./MyIcon.vue";
import { useI18n } from "vue-i18n";

export interface ButtonProps {
  label?: string;
  labelKey?: string;
  icon: string;
  key: string;
  disabled?: boolean;
}

const { t } = useI18n();

const props = defineProps<{
  options: readonly ButtonProps[] | ButtonProps[];
}>();

const model = defineModel<string>();

const currentCategory = computed(() => optionsList.value.find((option) => option.type === model.value));
const categoriesMenuOpened = ref(false);
const optionsList = computed(() =>
  props.options.map((v) => {
    return {
      label: v.label ?? t(v.labelKey!),
      type: v.key,
      icon: v.icon,
      disabled: v.disabled ?? false,
      click: () => (model.value = v.key),
      closePopup: true
    };
  })
);
</script>
