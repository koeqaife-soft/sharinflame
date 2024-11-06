<template>
  <q-page class="flex flex-center">
    <q-card class="login-card" unelevated>
      <q-card-section class="q-pa-md label-section">
        <div class="text-h6">{{ $t("login") }}</div>
      </q-card-section>
      <q-card-section>
        <q-form @submit="_login">
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
          />
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
              <q-icon
                :name="isPwd ? 'sym_o_visibility_off' : 'sym_o_visibility'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"
              />
            </template>
          </q-input>

          <q-btn :label="$t('login')" type="submit" class="full-width default-button" unelevated :loading="loading">
            <template v-slot:loading>
              <q-spinner class="loading" />
            </template>
          </q-btn>
          <q-btn
            :label="$t('register')"
            @click="$router.push({ path: '/register' })"
            class="full-width outlined-button q-mt-sm"
            unelevated
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { validateEmail, validatePassword } from "src/utils/validations";
import { isAxiosError } from "axios";
import { login } from "src/api/auth";
import { useRouter } from "vue-router";

const { t } = useI18n();
const router = useRouter();

const email = ref("");
const password = ref("");
const isPwd = ref(true);
const errors = ref({
  email: "",
  password: ""
});

const loading = ref(false);

const _validate = (result: string | boolean) => (result === true ? true : t(result || ""));
const _validateEmail = (val: string) => _validate(validateEmail(val));
const _validatePassword = (val: string) => _validate(validatePassword(val));

const _login = async () => {
  errors.value.email = "";
  errors.value.password = "";
  loading.value = true;
  try {
    const r = await login(email.value, password.value);
    if (r.data.success) router.push({ path: "/app" });
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
</script>
