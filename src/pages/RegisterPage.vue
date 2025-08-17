<template>
  <q-page class="flex flex-center">
    <div class="register-card card">
      <div class="q-pa-xs label-section card-section">
        <my-icon icon="person_add" />
        <div class="text-h6">{{ $t("register") }}</div>
      </div>
      <div class="card-section">
        <q-form @submit="_register" class="full-width">
          <q-input
            outlined
            v-model="username"
            :label="$t('username')"
            lazy-rules
            :rules="[_validateName]"
            :error="errors.username !== undefined"
            :error-message="errors.username"
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
            :error="errors.email !== undefined"
            :error-message="errors.email"
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

          <my-button
            :label="$t('register')"
            type="primary"
            btn-type="submit"
            class="full-width centered"
            :loading="loading"
          />
          <my-button
            type="outlined"
            :label="$t('login')"
            @click="$router.push({ path: '/login' })"
            class="full-width q-mt-sm centered"
          />
        </q-form>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { validateEmail, validatePassword, validateName } from "src/utils/validations";
import { isAxiosError } from "axios";
import { register } from "src/api/auth";
import { useRouter } from "vue-router";
import { useMainStore } from "src/stores/main-store";
import MyButton from "src/components/my/MyButton.vue";
import MyIcon from "src/components/my/MyIcon.vue";

const { t } = useI18n();
const mainStore = useMainStore();

const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const isPwd = ref(true);
const errors = ref({
  email: undefined as string | undefined,
  username: undefined as string | undefined
});

watch(username, () => (errors.value.username = undefined));
watch(email, () => (errors.value.email = undefined));

const loading = ref(false);

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
    if (r.data.success) {
      mainStore.initialized = 0;
      void router.push({ path: "/" });
    }
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response?.data["error"] == "USERNAME_EXISTS") {
        errors.value.username = t("username_exists");
      } else if (error.response?.data["error"] == "USER_ALREADY_EXISTS") {
        errors.value.email = t("email_exists");
      } else throw error;
    } else throw error;
  } finally {
    loading.value = false;
  }
};
</script>
