<template>
  <q-page class="flex flex-center">
    <div class="register-card card" ref="cardRef">
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
          >
            <template #prepend>
              <my-icon icon="person" />
            </template>
          </q-input>
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
            :hint="t('reg_hints.password')"
          >
            <template v-slot:append>
              <my-icon :icon="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd" />
            </template>
            <template #prepend>
              <my-icon icon="key" />
            </template>
          </q-input>
          <q-input
            outlined
            v-model="confirmPassword"
            :label="$t('confirm_password')"
            type="password"
            lazy-rules
            :rules="[validateConfirmPassword]"
            class="q-mb-md"
            :hint="t('reg_hints.confirm_password')"
          >
            <template #prepend>
              <my-icon icon="key" />
            </template>
          </q-input>

          <my-button
            :label="$t('register')"
            type="primary"
            btn-type="submit"
            class="full-width centered"
            icon-right="check"
            :loading="loading"
          />
          <my-button
            type="outlined"
            :label="$t('login')"
            @click="push({ path: '/login' })"
            icon-right="login"
            class="full-width q-mt-sm centered"
          />
        </q-form>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { validateEmail, validatePassword, validateName } from "src/utils/validations";
import { isAxiosError } from "axios";
import { check, register } from "src/api/auth";
import { useRouter } from "vue-router";
import { useMainStore } from "src/stores/main-store";
import MyButton from "src/components/my/MyButton.vue";
import MyIcon from "src/components/my/MyIcon.vue";

const { t } = useI18n();
const mainStore = useMainStore();

const cardRef = ref<HTMLDivElement>();
const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const isPwd = ref(true);
const errors = ref({
  email: undefined as string | undefined,
  username: undefined as string | undefined
});
let timeout: NodeJS.Timeout | null = null;

watch(username, () => (errors.value.username = undefined));
watch(email, () => (errors.value.email = undefined));

const loading = ref(false);

const router = useRouter();

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
      timeout = setTimeout(() => {
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
const _validateName = (val: string) => _validate(validateName(val));
const _validatePassword = (val: string) => _validate(validatePassword(val));

const validateConfirmPassword = (val: string) => val === password.value || t("passwords_must_match");

const _register = async () => {
  loading.value = true;
  try {
    await check("username", username.value);
    await check("email", email.value);
    const r = await register(username.value, email.value, password.value);
    if (r.data.success) {
      mainStore.initialized = 0;
      push({ path: "/" });
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

onUnmounted(() => {
  if (timeout) clearTimeout(timeout);
});
</script>
