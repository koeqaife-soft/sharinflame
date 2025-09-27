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
      <div class="title">{{ page != 1 ? $t(`email_change.title`) : $t("email_verify.title") }}</div>
      <q-form @submit="onOk" class="full-width">
        <div class="container" v-if="page == 0">
          <q-input
            borderless
            v-model="password"
            :label="$t('password')"
            class="full-width textarea card q-mb-md"
            :type="isPwd ? 'password' : 'text'"
            :disable="loading"
            :error="isIncorrect.password"
            :error-message="$t('email_change.incorrect_password')"
          >
            <template v-slot:append>
              <my-icon :icon="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd" />
            </template>
            <template #prepend>
              <my-icon icon="key"></my-icon>
            </template>
          </q-input>
          <q-input
            borderless
            v-model="email"
            :label="$t('new_email')"
            lazy-rules
            :rules="[_validateEmail]"
            class="full-width textarea card q-mb-md"
            :disable="loading"
            :error="emailError !== undefined"
            :error-message="emailError"
          >
            <template #prepend>
              <my-icon icon="mail"></my-icon>
            </template>
          </q-input>
        </div>

        <div class="container" v-else-if="page == 1">
          <q-input
            borderless
            v-model="code"
            autogrow
            maxlength="7"
            :label="$t('code')"
            class="full-width textarea card"
            :disable="loading"
            :error="isIncorrect.code"
            :error-message="$t('email_verify.incorrect')"
          >
            <template #prepend>
              <my-icon icon="key"></my-icon>
            </template>
          </q-input>
        </div>

        <div class="container" v-else-if="page == 2">
          {{ $t("email_change.pending") }}
        </div>

        <div class="buttons horizontal-container">
          <my-button :label="$t('cancel')" type="flat" icon="close" @click="dialogRef!.hide()" :disable="loading" />
          <my-button :label="$t('done')" type="primary" icon="check" btn-type="submit" :loading="loading" />
        </div>
      </q-form>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from "quasar";
import MyButton from "src/components/my/MyButton.vue";
import MyIcon from "src/components/my/MyIcon.vue";
import { onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { isAxiosError } from "axios";
import { changeEmailCheck, changeEmailSend } from "src/api/auth";
import { validateEmail } from "src/utils/validations";

const emit = defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const controller = new AbortController();

const quasar = useQuasar();
const { t } = useI18n();
const password = ref("");
const email = ref("");
const code = ref("");
const loading = ref(false);
const isIncorrect = ref({
  code: false,
  password: false
});
const isPwd = ref(true);
const emailError = ref<string>();

const page = ref(0);

let token: string;

const _validate = (result: string | boolean) => (result === true ? true : t(result || ""));
const _validateEmail = (val: string) => _validate(validateEmail(val));

watch(code, () => (isIncorrect.value.code = false));
watch(password, () => (isIncorrect.value.password = false));

async function onOk() {
  loading.value = true;
  try {
    if (page.value == 0) {
      const r = await changeEmailSend(password.value, email.value, { signal: controller.signal });
      token = r.data.data.token;
      page.value = 1;
    } else if (page.value == 1) {
      const r = await changeEmailCheck(token!, code.value, { signal: controller.signal });
      quasar.notify({
        type: "default-notification",
        message: t("email_change.title"),
        caption: t("email_change.success"),
        progress: true,
        icon: "sym_r_done_outline"
      });
      if (r.data.data.pending_until) {
        page.value = 2;
      } else {
        emit("ok");
      }
    } else {
      emit("ok");
    }
  } catch (e) {
    if (isAxiosError(e)) {
      if (e.response?.data.error == "INCORRECT") {
        isIncorrect.value.code = true;
        return;
      } else if (e.response?.data.error == "INCORRECT_PASSWORD") {
        isIncorrect.value.password = true;
        return;
      } else if (e.response?.data.error == "USER_ALREADY_EXISTS") {
        emailError.value = t("email_exists");
        return;
      }
    }
    quasar.notify({
      type: "error-notification",
      message: t("an_error_occurred"),
      progress: true
    });
    throw e;
  } finally {
    loading.value = false;
  }
}

onBeforeUnmount(() => {
  controller.abort();
});
</script>
