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
        :disable="applyLoading"
      />

      <q-input
        borderless
        v-model="aboutMe"
        :label="$t('about_me')"
        maxlength="512"
        autogrow
        class="input"
        ref="aboutMeRef"
        :disable="applyLoading"
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
            :disable="applyLoading"
          />
          <my-chip
            clickable
            :label="$t('add_language')"
            icon="add"
            class="language"
            :disable="languages.length >= MAX_LANGUAGES || applyLoading"
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
        <div class="horizontal-container image-state card" v-if="imageState.avatar">
          <my-icon :icon="stateIcons[imageState.avatar]!" />
          <div class="image-state-label">{{ $t(imageState.avatar) }}</div>
        </div>
        <div class="horizontal-container">
          <my-button
            type="primary"
            :label="$t('change_avatar')"
            @click="openCropper('avatar')"
            :disable="applyLoading"
          />
          <my-button
            type="outlined"
            :label="$t('remove_avatar')"
            :disable="applyLoading || !avatarUrl"
            @click="removeImage('avatar')"
          />
        </div>
      </div>

      <div class="card change-banner">
        <div class="horizontal-container">
          <my-icon icon="image" class="label-icon" />
          <div class="label">{{ $t("banner") }}</div>
        </div>
        <div class="horizontal-container image-state card" v-if="imageState.banner">
          <my-icon :icon="stateIcons[imageState.banner]!" />
          <div class="image-state-label">{{ $t(imageState.banner) }}</div>
        </div>
        <div class="horizontal-container">
          <my-button
            type="primary"
            :label="$t('change_banner')"
            @click="openCropper('banner')"
            :disable="applyLoading"
          />
          <my-button
            type="outlined"
            :label="$t('remove_banner')"
            :disable="applyLoading || !bannerUrl"
            @click="removeImage('banner')"
          />
        </div>
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
  <template v-if="cropperProps.if">
    <q-dialog
      v-model="cropperProps.show"
      transition-show="scale"
      transition-hide="scale"
      class="cropper-dialog card-dialog"
      maximized
    >
      <div class="dialog-content">
        <div class="title">{{ $t("crop_image") }}</div>
        <profile-cropper
          :img="cropperProps.img"
          :aspect-ratio="cropperProps.aspectRatio"
          :is-circle="cropperProps.type == 'avatar'"
          :target-width="cropperProps.type == 'avatar' ? 256 : 624"
          :target-height="cropperProps.type == 'avatar' ? 256 : 170"
          @dismiss="cropperDismiss"
          @apply="cropperApply"
        />
      </div>
    </q-dialog>
  </template>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent, onUnmounted } from "vue";
import { useProfileStore } from "src/stores/profile-store";
import { type QInput, useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import MyButton from "src/components/my/MyButton.vue";
import MyIcon from "src/components/my/MyIcon.vue";
import MyChip from "src/components/my/MyChip.vue";
import { useMainStore } from "src/stores/main-store";
import { uploadFile } from "src/api/storage";

const ProfileCropper = defineAsyncComponent(() => import("./ProfileCropper.vue"));

const stateIcons: Record<string, string> = {
  set: "check",
  not_set: "block",
  changed: "edit",
  removed: "delete"
};

const { t } = useI18n();
const quasar = useQuasar();
const mainStore = useMainStore();
const profileStore = useProfileStore();
const profile = ref(profileStore.profile);
const aboutMeRef = ref<QInput | null>(null);

const cropperProps = ref({
  if: false,
  show: false,
  aspectRatio: 1,
  img: "",
  type: "" as "avatar" | "banner"
});

const toCleanUp: string[] = [];

interface Upload {
  blob: Blob;
  filename: string;
}

let toUpload: {
  banner?: Upload | undefined;
  avatar?: Upload | undefined;
} = {};
let toRemove: ("avatar" | "banner")[];

const imageState = ref<{
  avatar?: string;
  banner?: string;
}>({
  avatar: "not_set",
  banner: "not_set"
});

const bannerUrl = ref("");
const avatarUrl = ref("");

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
  ...(!arraysAreEqual(languages.value, profile.value?.languages) && { languages: languages.value }),
  ...(bannerUrl.value !== (profile.value?.banner_url ?? "") && { banner_url: bannerUrl.value }),
  ...(avatarUrl.value !== (profile.value?.avatar_url ?? "") && { avatar_url: avatarUrl.value })
}));

const newProfile = computed(() => ({
  ...profile.value,
  ...updateValues.value
}));

function urlCleanUp() {
  for (const url of toCleanUp) {
    URL.revokeObjectURL(url);
  }
  toCleanUp.length = 0;
}

function arraysAreEqual<T>(a: T[] | undefined, b: T[] | undefined) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function openCropper(type: "avatar" | "banner") {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = () => {
    if (!input.files) return;
    const file = input.files[0];
    if (file) {
      const fileURL = URL.createObjectURL(file);
      cropperProps.value.img = fileURL;
      cropperProps.value.aspectRatio = type == "avatar" ? 1 : 11 / 3;
      cropperProps.value.show = true;
      cropperProps.value.if = true;
      cropperProps.value.type = type;
      toCleanUp.push(fileURL);
    }
  };
  input.click();
}

function cropperDismiss() {
  cropperProps.value.show = false;
  setTimeout(() => {
    if (!cropperProps.value.show) {
      cropperProps.value.if = false;
    }
  }, 300);
}

function removeImage(type: "avatar" | "banner") {
  if (type == "avatar") {
    avatarUrl.value = "";
    imageState.value.avatar = "removed";
  } else {
    bannerUrl.value = "";
    imageState.value.banner = "removed";
  }
  toRemove.push(type);
  toUpload[type] = undefined;
}

function cropperApply(blob: Blob) {
  const img = URL.createObjectURL(blob);
  const type = cropperProps.value.type;
  toUpload[type] = {
    blob: blob,
    filename: `${crypto.randomUUID()}.webp`
  };
  if (type == "avatar") {
    imageState.value.avatar = "changed";
    avatarUrl.value = img;
  } else {
    imageState.value.banner = "changed";
    bannerUrl.value = img;
  }
  toCleanUp.push(img);
  cropperDismiss();
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
    bannerUrl.value = profile.value?.banner_url ?? "";
    avatarUrl.value = profile.value?.avatar_url ?? "";

    let _avatarUrl: string | undefined = undefined;
    let _bannerUrl: string | undefined = undefined;
    const _updateValues: UpdateProfileValues = {
      ...updateValues.value
    };

    for (const key of toRemove) {
      if (key == "avatar") {
        _updateValues.avatar_context_id = null;
        _avatarUrl = "";
      } else {
        _updateValues.banner_context_id = null;
        _bannerUrl = "";
      }
    }

    const uploadPromises = [];

    if (toUpload.avatar) {
      uploadPromises.push(
        uploadFile(toUpload.avatar.filename, toUpload.avatar.blob, "avatar").then((r) => {
          _avatarUrl = r.data.data.file_url;
          _updateValues.avatar_context_id = r.data.data.context_id;
        })
      );
    }

    if (toUpload.banner) {
      uploadPromises.push(
        uploadFile(toUpload.banner.filename, toUpload.banner.blob, "banner").then((r) => {
          _bannerUrl = r.data.data.file_url;
          _updateValues.banner_context_id = r.data.data.context_id;
        })
      );
    }

    await Promise.all(uploadPromises);

    await profileStore.updateProfile(_updateValues, _avatarUrl, _bannerUrl);
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
    void onLoad();
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
  bannerUrl.value = profile.value?.banner_url ?? "";
  avatarUrl.value = profile.value?.avatar_url ?? "";
  loaded.value = true;
  toUpload = {};
  toRemove = [];

  if (avatarUrl.value) {
    imageState.value.avatar = "set";
  }
  if (bannerUrl.value) {
    imageState.value.banner = "set";
  }

  urlCleanUp();
}

onMounted(onLoad);

onUnmounted(() => {
  urlCleanUp();
});
</script>
