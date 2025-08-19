<template>
  <q-scroll-area class="scroll-area fix-scroll-area full-height account-view" :visible="false" v-if="loaded">
    <div class="card container profile-container">
      <div class="horizontal-container">
        <my-icon icon="account_circle" class="label-icon" :style="{ transform: 'translateY(-2px)' }" />
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
          <my-chip
            v-for="(language, index) in languages"
            :key="index"
            :removable="true"
            @remove="removeLanguage(index)"
            class="language"
            :label="language"
          />
          <my-chip
            clickable
            :label="$t('add_language')"
            icon="add"
            class="language"
            :disable="languages.length >= MAX_LANGUAGES"
          >
            <q-menu class="menu-card enter-language-menu field-menu" v-if="languages.length < MAX_LANGUAGES">
              <q-input
                v-model="addLangValue"
                :label="$t('enter_language')"
                @keyup.enter="addLanguage"
                borderless
                class="language-input full-width"
                maxlength="16"
              >
                <template v-slot:append>
                  <my-button icon="add" class="add-button" @click="addLanguage" :disable="addLangValue.length == 0" />
                </template>
              </q-input>
            </q-menu>
          </my-chip>
        </div>
      </div>

      <div class="card change-avatar">
        <div class="horizontal-container">
          <my-icon icon="account_box" class="label-icon" />
          <div class="label">{{ $t("avatar") }}</div>
        </div>
        <div class="horizontal-container">
          <my-button type="primary" :label="$t('change_avatar')" :disable="true" />
          <my-button type="outlined" :label="$t('remove_avatar')" :disable="true" />
        </div>
        <div style="color: var(--outline)">Not Implemented Yet</div>
      </div>

      <div class="card change-banner">
        <div class="horizontal-container">
          <my-icon icon="image" class="label-icon" />
          <div class="label">{{ $t("banner") }}</div>
        </div>
        <div class="horizontal-container">
          <my-button type="primary" :label="$t('change_banner')" :disable="true" />
          <my-button type="outlined" :label="$t('remove_banner')" :disable="true" />
        </div>
        <div style="color: var(--outline)">Not Implemented Yet</div>
      </div>

      <div class="horizontal-container button-container">
        <my-button
          type="outlined"
          class="preview-button"
          :label="$t('preview')"
          @click="previewProfile"
          icon-right="visibility"
        />
        <my-button
          type="outlined"
          class="cancel-button"
          :label="$t('cancel')"
          @click="onLoad"
          :disable="Object.keys(updateValues).length === 0 || applyLoading"
          icon-right="cancel"
        />
        <my-button
          type="primary"
          class="save-button"
          :label="$t('apply')"
          @click="updateProfile"
          :disable="Object.keys(updateValues).length === 0"
          icon-right="check"
          :loading="applyLoading"
        />
      </div>
    </div>
  </q-scroll-area>
  <div class="loading-container" v-else>
    <q-spinner size="42px" color="primary" />
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useProfileStore } from "src/stores/profile-store";
import { type QInput, useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import MyButton from "src/components/my/MyButton.vue";
import MyIcon from "src/components/my/MyIcon.vue";
import MyChip from "src/components/my/MyChip.vue";
import { useMainStore } from "src/stores/main-store";

const { t } = useI18n();
const quasar = useQuasar();
const mainStore = useMainStore();
const profileStore = useProfileStore();
const profile = ref(profileStore.profile);
const aboutMeRef = ref<QInput | null>(null);

const displayName = ref("");
const aboutMe = ref("");
const addLangValue = ref("");

const languages = ref<string[]>([]);
const MAX_LANGUAGES = 8;

const applyLoading = ref(false);
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
  applyLoading.value = true;
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
  } finally {
    applyLoading.value = false;
  }
}

function previewProfile() {
  mainStore.openDialog("user", "preview", { user: newProfile.value, notSync: true });
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
