<template>
  <q-page class="flex flex-center">
    <q-card class="register-card" unelevated>
      <q-card-section class="q-pa-md label-section">
        <div class="text-h6">{{ $t("register") }}</div>
      </q-card-section>
      <q-card-section>
        <q-form @submit="_register">
          <q-input
            outlined
            v-model="username"
            :label="$t('username')"
            lazy-rules
            :rules="[_validateName]"
            :error="usernameError.hasError"
            :error-message="usernameError.message"
            :hint="t('reg_hints.username')"
            class="q-mb-sm"
          />
          <q-input
            outlined
            v-model="email"
            :label="$t('email')"
            type="email"
            lazy-rules
            :rules="[_validateEmail]"
            :error="emailError.hasError"
            :error-message="emailError.message"
            class="q-mb-sm"
            :hint="t('reg_hints.email')"
          />
          <q-input
            outlined
            v-model="password"
            :label="$t('password')"
            :type="isPwd ? 'password' : 'text'"
            lazy-rules
            :rules="[_validatePassword]"
            class="q-mb-sm"
            :hint="t('reg_hints.password')"
          >
            <template v-slot:append>
              <q-icon
                :name="isPwd ? 'sym_r_visibility_off' : 'sym_r_visibility'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"
              /> </template
          ></q-input>
          <q-input
            outlined
            v-model="confirmPassword"
            :label="$t('confirm_password')"
            type="password"
            lazy-rules
            :rules="[validateConfirmPassword]"
            class="q-mb-md"
            :hint="t('reg_hints.confirm_password')"
          />

          <q-btn :label="$t('register')" type="submit" class="full-width default-button" unelevated :loading="loading">
            <template v-slot:loading>
              <q-spinner class="loading" />
            </template>
          </q-btn>
          <q-btn
            :label="$t('login')"
            @click="$router.push({ path: '/login' })"
            class="full-width outlined-button q-mt-sm"
            unelevated
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { validateEmail, validatePassword, validateName } from "src/utils/validations";
import { isAxiosError } from "axios";
import { register } from "src/api/auth";
import { useRouter } from "vue-router";

const { t } = useI18n();

const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const isPwd = ref(true);
const existing = ref<{ username: string | null; email: string | null }>({
  username: null,
  email: null
});

const loading = ref(false);

const usernameError = computed(() => {
  const message = username.value != existing.value.username;
  return {
    hasError: message !== true,
    message: message === true ? "" : t("username_exists")
  };
});

const emailError = computed(() => {
  const message = email.value != existing.value.email;
  return {
    hasError: message !== true,
    message: message === true ? "" : t("email_exists")
  };
});

const router = useRouter();

const _validate = (result: string | boolean) => (result === true ? true : t(result || ""));
const _validateEmail = (val: string) => _validate(validateEmail(val));
const _validateName = (val: string) => _validate(validateName(val));
const _validatePassword = (val: string) => _validate(validatePassword(val));

const validateConfirmPassword = (val: string) => val === password.value || t("passwords_must_match");

const _register = async () => {
  loading.value = true;
  try {
    const r = await register(username.value, email.value, password.value);
    if (r.data.success) void router.push({ path: "/app" });
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response?.data["error"] == "USERNAME_EXISTS") {
        existing.value.username = username.value;
      } else if (error.response?.data["error"] == "USER_ALREADY_EXISTS") {
        existing.value.email = email.value;
      } else throw error;
    } else throw error;
  } finally {
    loading.value = false;
  }
};
</script>
