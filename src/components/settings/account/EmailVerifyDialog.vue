<template>
  <q-dialog
    transition-show="scale"
    transition-hide="scale"
    class="text-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    persistent
  >
    <div class="dialog-content">
      <div class="title">{{ $t(`email_verify.title`) }}</div>
      <q-input
        borderless
        v-model="text"
        autogrow
        maxlength="7"
        :label="$t('code')"
        class="full-width textarea card"
        :disable="loading"
        :error="isIncorrect"
        :error-message="$t('email_verify.incorrect')"
      >
        <template #prepend>
          <my-icon icon="key"></my-icon>
        </template>
      </q-input>
      <div class="buttons horizontal-container">
        <my-button :label="$t('cancel')" type="flat" icon="close" @click="dialogRef!.hide()" :disable="loading" />
        <my-button :label="$t('verify')" type="primary" icon="check" @click="onOk" :loading="loading" />
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from "quasar";
import MyButton from "src/components/my/MyButton.vue";
import MyIcon from "src/components/my/MyIcon.vue";
import { onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { verifyEmailCheck } from "src/api/auth";
import { isAxiosError } from "axios";

const emit = defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const controller = new AbortController();

const props = defineProps<{
  token: string;
}>();

const quasar = useQuasar();
const { t } = useI18n();
const text = ref("");
const loading = ref(false);
const isIncorrect = ref(false);

watch(text, () => (isIncorrect.value = false));

async function onOk() {
  loading.value = true;
  try {
    await verifyEmailCheck(props.token, text.value.trim(), { signal: controller.signal });

    quasar.notify({
      type: "default-notification",
      message: t("email_verify.title"),
      caption: t("email_verify.success"),
      progress: true,
      icon: "sym_r_done_outline"
    });

    emit("ok");
  } catch (e) {
    if (isAxiosError(e) && e.response?.data.error == "INCORRECT") {
      isIncorrect.value = true;
    } else {
      quasar.notify({
        type: "error-notification",
        message: t("email_verify.failed"),
        progress: true
      });
      throw e;
    }
  } finally {
    loading.value = false;
  }
}

onBeforeUnmount(() => {
  controller.abort();
});
</script>
