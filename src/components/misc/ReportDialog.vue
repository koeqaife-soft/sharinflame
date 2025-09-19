<template>
  <q-dialog
    transition-show="scale"
    transition-hide="scale"
    class="report-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
  >
    <div class="dialog-content">
      <div class="title">{{ $t(`report_dialog.title`) }}</div>
      <q-input
        borderless
        v-model="text"
        autogrow
        maxlength="512"
        :label="$t('reason')"
        class="full-width textarea card"
        :disable="loading"
      />
      <div class="buttons horizontal-container">
        <my-button :label="$t('cancel')" type="flat" icon="close" @click="dialogRef!.hide()" :disable="loading" />
        <my-button :label="$t('report')" type="primary" icon="report" @click="onOk" :loading="loading" />
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from "quasar";
import MyButton from "../my/MyButton.vue";
import { ref } from "vue";
import { createReport } from "src/api/moderation";
import { useI18n } from "vue-i18n";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const props = defineProps<{
  targetType: "user" | "message" | "post" | "comment";
  targetId: string;
}>();

const quasar = useQuasar();
const { t } = useI18n();
const text = ref("");
const loading = ref(false);

async function onOk() {
  loading.value = true;
  try {
    await createReport(text.value, props.targetId, props.targetType);

    quasar.notify({
      type: "default-notification",
      message: t("report_dialog.title"),
      caption: t("report_dialog.success"),
      progress: true,
      icon: "sym_r_done_outline"
    });

    dialogRef.value?.hide();
  } catch {
    quasar.notify({
      type: "error-notification",
      message: t("report_dialog.failed"),
      progress: true
    });
  } finally {
    loading.value = false;
  }
}
</script>
