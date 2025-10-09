<template>
  <q-page class="flex flex-center">
    <div class="login-card card" ref="cardRef">
      <div class="q-pa-xs label-section card-section">
        <my-icon icon="login" />
        <div class="text-h6">{{ $t("login") }}</div>
      </div>
      <div class="card-section">
        <q-form @submit="_login" class="full-width">
          <q-input
            outlined
            v-model="email"
            :label="$t('email')"
            type="email"
            lazy-rules
            :rules="[_validateEmail]"
            class="q-mb-sm"
            :error="!!errors.email"
            :error-message="errors.email"
          >
            <template #prepend>
              <my-icon icon="mail" />
            </template>
          </q-input>
          <q-input
            outlined
            v-model="password"
            :label="$t('password')"
            :type="isPwd ? 'password' : 'text'"
            lazy-rules
            :rules="[_validatePassword]"
            class="q-mb-sm"
            :error="!!errors.password"
            :error-message="errors.password"
          >
            <template v-slot:append>
              <my-icon :icon="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd" />
            </template>
            <template #prepend>
              <my-icon icon="key" />
            </template>
          </q-input>

          <my-button
            :label="$t('login')"
            type="primary"
            btn-type="submit"
            class="full-width centered"
            icon-right="check"
            :loading="loading"
          />
          <my-button
            type="outlined"
            :label="$t('register')"
            @click="push({ path: '/register' })"
            icon-right="person_add"
            class="full-width centered q-mt-sm"
          />
        </q-form>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { validateEmail, validatePassword } from "src/utils/validations";
import { isAxiosError } from "axios";
import { login } from "src/api/auth";
import { useRouter } from "vue-router";
import { useMainStore } from "src/stores/main-store";
import MyButton from "src/components/my/MyButton.vue";
import MyIcon from "src/components/my/MyIcon.vue";

const { t } = useI18n();
const router = useRouter();
const mainStore = useMainStore();

let controller = new AbortController();

const cardRef = ref<HTMLDivElement>();
const email = ref("");
const password = ref("");
const isPwd = ref(true);
const errors = ref({
  email: "",
  password: ""
});
watch(email, () => (errors.value.email = ""));
watch(password, () => (errors.value.password = ""));

const loading = ref(false);

function push(...props: Parameters<typeof router.push>) {
  if (cardRef.value) {
    cardRef.value.classList.add("is-exit");
    const style = getComputedStyle(cardRef.value);
    const duration = style.animationDuration || style.transitionDuration;
    if (duration) {
      let ms = 0;
      if (duration.includes("ms")) {
        ms = parseFloat(duration);
      } else if (duration.includes("s")) {
        ms = parseFloat(duration) * 1000;
      }
      setTimeout(() => {
        void router.push(...props);
      }, ms);
    } else {
      void router.push(...props);
    }
  } else {
    void router.push(...props);
  }
}

const _validate = (result: string | boolean) => (result === true ? true : t(result || ""));
const _validateEmail = (val: string) => _validate(validateEmail(val));
const _validatePassword = (val: string) => _validate(validatePassword(val));

const _login = async () => {
  if (loading.value) return;
  controller.abort();
  controller = new AbortController();
  errors.value.email = "";
  errors.value.password = "";
  loading.value = true;
  try {
    const r = await login(email.value, password.value, { signal: controller.signal });
    if (r.data.success) {
      mainStore.initialized = 0;
      push({ path: "/" });
    }
  } catch (error) {
    if (isAxiosError(error)) {
      const errorData = error.response?.data?.error;
      if (errorData === "INCORRECT_PASSWORD") {
        errors.value.password = t("incorrect_password");
      } else if (errorData === "USER_DOES_NOT_EXIST") {
        errors.value.email = t("user_does_not_exist");
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  } finally {
    loading.value = false;
  }
};

onUnmounted(() => {
  controller.abort();
});
</script>
