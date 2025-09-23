<template>
  <q-dialog
    transition-show="scale"
    transition-hide="scale"
    class="password-change-dialog text-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
  >
    <div class="dialog-content">
      <div class="title">{{ $t(`password_change.title`) }}</div>
      <q-form @submit="onOk" class="full-width">
        <div class="container">
          <q-input
            borderless
            v-model="text"
            :label="$t('old_password')"
            class="full-width textarea card q-mb-md"
            :type="isPwd1 ? 'password' : 'text'"
            :disable="loading"
            :error="isIncorrect"
            :error-message="$t('password_change.incorrect')"
          >
            <template v-slot:append>
              <my-icon
                :icon="isPwd1 ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwd1 = !isPwd1"
              />
            </template>
            <template #prepend>
              <my-icon icon="lock"></my-icon>
            </template>
          </q-input>
          <q-input
            borderless
            v-model="newPassword"
            :label="$t('new_password')"
            :type="isPwd2 ? 'password' : 'text'"
            class="full-width textarea card q-mb-md"
            :disable="loading"
            lazy-rules
            :rules="[_validatePassword]"
          >
            <template v-slot:append>
              <my-icon
                :icon="isPwd2 ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwd2 = !isPwd2"
              />
            </template>
            <template #prepend>
              <my-icon icon="key"></my-icon>
            </template>
          </q-input>
          <q-input
            borderless
            v-model="repeatedPassword"
            :type="isPwd2 ? 'password' : 'text'"
            :label="$t('confirm_password')"
            class="full-width textarea card q-mb-md"
            :disable="loading"
            lazy-rules
            :rules="[validateConfirmPassword]"
          >
            <template #prepend>
              <my-icon icon="key"></my-icon>
            </template>
          </q-input>
          <div class="close-sessions card">
            <div class="label">{{ $t("password_change.close_all_sessions") }}</div>
            <my-switch v-model="closeSessions" />
          </div>
        </div>
        <div class="buttons horizontal-container">
          <my-button :label="$t('cancel')" type="flat" icon="close" @click="dialogRef!.hide()" :disable="loading" />
          <my-button :label="$t('verify')" type="primary" icon="check" btn-type="submit" :loading="loading" />
        </div>
      </q-form>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from "quasar";
import MyButton from "src/components/my/MyButton.vue";
import MyIcon from "src/components/my/MyIcon.vue";
import MySwitch from "src/components/my/MySwitch.vue";
import { onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { isAxiosError } from "axios";
import { validatePassword } from "src/utils/validations";
import { changePassword } from "src/api/auth";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const controller = new AbortController();

const quasar = useQuasar();
const { t } = useI18n();
const text = ref("");
const newPassword = ref("");
const repeatedPassword = ref("");
const loading = ref(false);
const isIncorrect = ref(false);
const isPwd1 = ref(true);
const isPwd2 = ref(true);
const closeSessions = ref(true);

watch(text, () => (isIncorrect.value = false));

const _validate = (result: string | boolean) => (result === true ? true : t(result || ""));
const _validatePassword = (val: string) => _validate(validatePassword(val));
const validateConfirmPassword = (val: string) => val === newPassword.value || t("passwords_must_match");

async function onOk() {
  loading.value = true;
  if (_validatePassword(newPassword.value) !== true) return;
  if (validateConfirmPassword(repeatedPassword.value) !== true) return;

  try {
    await changePassword(text.value, newPassword.value, { signal: controller.signal }, closeSessions.value);

    quasar.notify({
      type: "default-notification",
      message: t("password_change.title"),
      caption: t("password_change.success"),
      progress: true,
      icon: "sym_r_done_outline"
    });

    dialogRef.value!.hide();
  } catch (e) {
    if (isAxiosError(e) && e.response?.data.error == "INCORRECT_PASSWORD") {
      isIncorrect.value = true;
    } else {
      quasar.notify({
        type: "error-notification",
        message: t("password_change.failed"),
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
