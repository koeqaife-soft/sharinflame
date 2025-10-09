<template>
  <q-dialog
    transition-show="scale"
    transition-hide="scale"
    class="ok-cancel-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    :persistent="persistent"
  >
    <div class="dialog-content">
      <div class="title">{{ $t(`${localeKey}.title`) }}</div>
      <div class="message">{{ $t(`${localeKey}.message`) }}</div>
      <div class="buttons horizontal-container">
        <my-button v-if="showCancel" :label="$t(cancelKey!)" type="flat" icon="close" @click="onCancel" />
        <my-button v-if="showOk" :label="$t(okKey!)" :type="okType!" :icon="okIcon" @click="onOk" />
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import { useDialogPluginComponent } from "quasar";
import MyButton from "../my/MyButton.vue";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent();

function onCancel() {
  onDialogCancel();
  dialogRef.value?.hide();
}

function onOk() {
  onDialogOK();
  dialogRef.value?.hide();
}

withDefaults(
  defineProps<{
    localeKey: string;
    cancelKey?: string;
    okKey?: string;
    okType?: "primary" | "secondary" | "outlined" | "card" | "none" | "attention" | "flat";
    okIcon?: string;
    showCancel?: boolean;
    showOk?: boolean;
    persistent?: boolean;
  }>(),
  {
    cancelKey: "cancel",
    okKey: "ok",
    okType: "primary",
    okIcon: "check",
    showCancel: true,
    showOk: true,
    persistent: false
  }
);
</script>
