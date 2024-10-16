<template>
  <q-page class="flex flex-center">
    <q-card class="register-card">
      <q-card-section class="q-pa-md label-section">
        <div class="text-h6">{{ $t("register") }}</div>
      </q-card-section>
      <q-card-section>
        <q-form @submit="register">
          <q-input
            outlined
            v-model="username"
            :label="$t('username')"
            lazy-rules
            :rules="[_validateName]"
            class="q-mb-sm"
          />
          <q-input
            outlined
            v-model="email"
            :label="$t('email')"
            type="email"
            lazy-rules
            :rules="[_validateEmail]"
            class="q-mb-sm"
          />
          <q-input
            outlined
            v-model="password"
            :label="$t('password')"
            :type="isPwd ? 'password' : 'text'"
            lazy-rules
            :rules="[_validatePassword]"
            class="q-mb-sm"
          >
            <template v-slot:append>
              <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
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
          />

          <q-btn :label="$t('register')" type="submit" class="full-width default-button" />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { validateEmail, validatePassword, validateName } from "src/utils/validations";

const { t } = useI18n();

const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const isPwd = ref(true);

const _validate = (result: string | boolean) => (result === true ? true : t(result || ""));
const _validateEmail = (val: string) => _validate(validateEmail(val));
const _validateName = (val: string) => _validate(validateName(val));
const _validatePassword = (val: string) => _validate(validatePassword(val));

const validateConfirmPassword = (val: string) => val === password.value || t("passwords_must_match");

const register = () => {
  console.log("Logging in with", email.value, password.value);
};
</script>
