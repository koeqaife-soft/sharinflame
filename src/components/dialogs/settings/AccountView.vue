<template>
  <q-scroll-area class="scroll-area fix-scroll-area full-height account-view" :visible="false" v-if="loaded">
    <div class="card container profile-container">
      <div class="horizontal-container">
        <q-icon name="sym_r_account_circle" class="label-icon" :style="{ transform: 'translateY(-2px)' }" />
        <div class="label">{{ $t("profile") }}</div>
      </div>

      <q-input
        borderless
        v-model="displayName"
        :label="$t('display_name')"
        maxlength="16"
        :placeholder="profile?.username"
        class="input"
      />

      <q-input
        borderless
        v-model="aboutMe"
        :label="$t('about_me')"
        maxlength="512"
        autogrow
        class="input"
        ref="aboutMeRef"
      />

      <div class="card languages">
        <div class="horizontal-container">
          <q-icon name="sym_r_language" class="label-icon" />
          <div class="label">{{ $t("languages") }}</div>
        </div>
        <div class="chips">
          <q-chip
            v-for="(language, index) in languages"
            :key="index"
            removable
            icon-remove="sym_r_close"
            @remove="removeLanguage(index)"
            class="language"
          >
            {{ language }}
          </q-chip>
          <q-chip clickable icon="sym_r_add" class="language" :disable="languages.length >= MAX_LANGUAGES">
            {{ $t("add_language") }}
            <q-menu class="menu-card enter-language-menu" v-if="languages.length < MAX_LANGUAGES">
              <q-input
                v-model="addLangValue"
                :label="$t('enter_language')"
                @keyup.enter="addLanguage"
                borderless
                class="language-input full-width"
                maxlength="16"
              >
                <template v-slot:append>
                  <q-btn
                    round
                    flat
                    icon="sym_r_add"
                    class="add-button"
                    @click="addLanguage"
                    :disable="addLangValue.length == 0"
                  />
                </template>
              </q-input>
            </q-menu>
          </q-chip>
        </div>
      </div>

      <div class="card change-avatar">
        <div class="horizontal-container">
          <q-icon name="sym_r_account_box" class="label-icon" />
          <div class="label">{{ $t("avatar") }}</div>
        </div>
        <div class="horizontal-container">
          <q-btn
            unelevated
            no-caps
            class="preview-button default-button"
            :label="$t('change_avatar')"
            :disable="true"
          />
          <q-btn
            unelevated
            no-caps
            class="preview-button outlined-button"
            :label="$t('remove_avatar')"
            :disable="true"
          />
        </div>
        <div style="color: var(--outline)">Not Implemented Yet</div>
      </div>

      <div class="card change-banner">
        <div class="horizontal-container">
          <q-icon name="sym_r_image" class="label-icon" />
          <div class="label">{{ $t("banner") }}</div>
        </div>
        <div class="horizontal-container">
          <q-btn
            unelevated
            no-caps
            class="preview-button default-button"
            :label="$t('change_banner')"
            :disable="true"
          />
          <q-btn
            unelevated
            no-caps
            class="preview-button outlined-button"
            :label="$t('remove_banner')"
            :disable="true"
          />
        </div>
        <div style="color: var(--outline)">Not Implemented Yet</div>
      </div>

      <div class="horizontal-container button-container">
        <q-btn
          unelevated
          no-caps
          class="preview-button outlined-button"
          :label="$t('preview')"
          @click="previewProfile"
          icon-right="sym_r_visibility"
        />
        <q-btn
          unelevated
          no-caps
          class="cancel-button outlined-button animate"
          :label="$t('cancel')"
          @click="onLoad"
          :disable="Object.keys(updateValues).length === 0"
          icon-right="sym_r_cancel"
        />
        <q-btn
          unelevated
          no-caps
          class="save-button default-button animate"
          :label="$t('apply')"
          @click="updateProfile"
          :disable="Object.keys(updateValues).length === 0"
          icon-right="sym_r_check"
        />
      </div>
    </div>
  </q-scroll-area>
  <div class="loading-container" v-else>
    <q-spinner size="42px" color="primary" />
  </div>
</template>
<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted } from "vue";
import { useProfileStore } from "src/stores/profile-store";
import { type QInput, useQuasar } from "quasar";
import { useI18n } from "vue-i18n";

const UserDialog = defineAsyncComponent(() => import("../UserDialog.vue"));

const { t } = useI18n();
const quasar = useQuasar();
const profileStore = useProfileStore();
const profile = ref(profileStore.profile);
const aboutMeRef = ref<QInput | null>(null);

const displayName = ref("");
const aboutMe = ref("");
const addLangValue = ref("");

const languages = ref<string[]>([]);
const MAX_LANGUAGES = 8;

const loaded = ref(false);

const updateValues = computed(() => ({
  ...(displayName.value !== profile.value?.display_name && { display_name: displayName.value }),
  ...(aboutMe.value !== profile.value?.bio && { bio: aboutMe.value }),
  ...(!arraysAreEqual(languages.value, profile.value?.languages) && { languages: languages.value })
}));

const newProfile = computed(() => ({
  ...profile.value,
  ...updateValues.value
}));

function arraysAreEqual<T>(a: T[] | undefined, b: T[] | undefined) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function addLanguage() {
  if (addLangValue.value && !languages.value.includes(addLangValue.value)) {
    languages.value.push(addLangValue.value);
    addLangValue.value = "";
  }
}

function removeLanguage(index: number) {
  languages.value.splice(index, 1);
}

async function updateProfile() {
  try {
    await profileStore.updateProfile(updateValues.value);
    profile.value = profileStore.profile;
    quasar.notify({
      type: "default-notification",
      message: t("profile_updated.msg"),
      caption: t("profile_updated.caption"),
      progress: true,
      icon: "sym_r_done_outline"
    });
  } catch (e) {
    quasar.notify({
      type: "error-notification",
      message: t("profile_updated.failed"),
      progress: true
    });
    throw e;
  }
}

function previewProfile() {
  quasar.dialog({
    component: UserDialog,
    componentProps: { user: newProfile.value, notSync: true }
  });
}

async function onLoad() {
  await profileStore.getProfile();
  displayName.value = profile.value?.display_name ?? "";
  aboutMe.value = profile.value?.bio ?? "";
  languages.value = [...(profile.value?.languages ?? [])];
  loaded.value = true;
}

onMounted(onLoad);
</script>
