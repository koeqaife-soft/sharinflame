<template>
  <q-scroll-area class="scroll-area fix-scroll-area full-height security-view" :visible="false" v-if="authUser">
    <div class="container">
      <div class="card section email">
        <div class="content">
          <div class="header">
            <my-icon class="label-icon" icon="email" />
            <div class="label">{{ $t("email") }}</div>
          </div>
          <div class="section-value">{{ email }}</div>
        </div>
        <div class="buttons">
          <my-button
            type="card"
            @click="revealEmail = !revealEmail"
            :icon-right="revealEmail ? 'visibility_off' : 'visibility'"
          />
          <my-button
            type="attention"
            :label="$t('verify')"
            icon-right="check"
            :loading="emailVerifyLoading"
            @click="verifyEmail"
            v-if="!authUser.email_verified"
          />
          <my-button
            type="primary"
            :label="$t('edit')"
            icon-right="edit"
            :disable="emailVerifyLoading"
            @click="changeEmail"
          />
        </div>
      </div>

      <div class="card section email" v-if="authUser.pending_email">
        <div class="content">
          <div class="header">
            <my-icon class="label-icon" icon="email" />
            <div class="label">{{ $t("pending_email_change") }}</div>
          </div>
          <div class="section-value">{{ authUser.pending_email }}</div>
        </div>
        <div class="buttons">
          <my-button type="attention" :label="$t('cancel')" icon-right="close" @click="cancelChanging" />
        </div>
      </div>

      <div class="card section password">
        <div class="content">
          <div class="header">
            <my-icon class="label-icon" icon="key" />
            <div class="label">{{ $t("password") }}</div>
          </div>
          <div class="section-value">{{ $t("hidden") }}</div>
        </div>
        <div class="buttons">
          <my-button
            type="primary"
            :label="$t('edit')"
            icon-right="edit"
            @click="mainStore.openDialog('passwordChange', '', {})"
          />
        </div>
      </div>
    </div>
  </q-scroll-area>
  <div class="loading-container" v-else>
    <my-spinner size="55px" color="primary" />
  </div>
</template>
<script setup lang="ts">
import { changeEmailCancel, getAuthMe, verifyEmailSend } from "src/api/auth";
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from "vue";
import MyIcon from "../my/MyIcon.vue";
import MyButton from "../my/MyButton.vue";
import { useMainStore } from "src/stores/main-store";
import { isAxiosError } from "axios";

const mainStore = useMainStore();
const MySpinner = defineAsyncComponent(() => import("src/components/my/MySpinner.vue"));

const controller = new AbortController();

const authUser = ref<AuthUser>();

// Email
const revealEmail = ref(false);
const emailVerifyLoading = ref(false);
const email = computed(() => {
  if (!authUser.value) return "Unknown";
  if (revealEmail.value) return authUser.value.email;
  const [name, domain] = authUser.value.email.split("@");
  const maskedName = name!.slice(0, 2) + "*".repeat(Math.max(name!.length - 2, 0));
  return `${maskedName}@${domain}`;
});

async function verifyEmail() {
  emailVerifyLoading.value = true;
  try {
    const verify = await verifyEmailSend({ signal: controller.signal });
    const token = verify.data.data.token;
    mainStore.openDialog("emailVerify", "", { token }, () => {
      authUser.value!.email_verified = true;
    });
  } catch (e) {
    if (isAxiosError(e) && e.response?.data.error == "ALREADY_VERIFIED") {
      authUser.value!.email_verified = true;
    }
  } finally {
    emailVerifyLoading.value = false;
  }
}

async function updateUser() {
  authUser.value = (await getAuthMe({ signal: controller.signal })).data.data;
}

async function cancelChanging() {
  await changeEmailCancel({ signal: controller.signal });
  void updateUser();
}

function changeEmail() {
  mainStore.openDialog("changeEmail", "", {}, () => {
    void updateUser();
  });
}

onMounted(async () => {
  await updateUser();
});

onBeforeUnmount(() => {
  controller.abort();
});
</script>
