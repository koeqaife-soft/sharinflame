<template>
  <q-dialog
    transition-show="slide-up"
    transition-hide="slide-down"
    class="user-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    :key="user.user_id"
  >
    <closeable-content v-on:hide="dialogRef!.hide()" :class="{ expand: expand }">
      <template v-if="loaded">
        <div class="profile-info">
          <q-img :src="userRef.banner_url" class="card banner" />
          <q-btn round flat class="close" icon="sym_r_close" @click="dialogRef?.hide" />
          <div class="profile-inner">
            <user-avatar :user="userRef" />
            <div class="container name-container">
              <div class="display-name">{{ userRef.display_name || userRef.username }}</div>
              <div class="username">@{{ userRef.username }}</div>
            </div>
          </div>
        </div>
        <category-buttons-container
          :categories-list="categoriesList"
          :current-type="currentType"
          container-class="horizontal-container card profile-categories q-mb-sm"
          style="z-index: 2"
        />
        <user-dialog-info :user="userRef" v-if="currentType == 'info'" :meta="meta" />
        <user-dialog-posts :user="userRef" v-else-if="currentType == 'posts'" :meta="meta" v-model:expand="expand" />
      </template>
      <template v-else>
        <div class="profile-info">
          <q-skeleton type="rect" class="card banner" />
          <q-btn round flat class="close" icon="sym_r_close" @click="dialogRef?.hide" />
          <div class="profile-inner">
            <q-skeleton type="QAvatar" class="avatar" />
            <div class="container name-container">
              <q-skeleton type="text" class="display-name" style="min-width: 120px" />
              <q-skeleton type="text" class="username" style="min-width: 60px" />
            </div>
          </div>
        </div>
        <category-buttons-container
          :categories-list="categoriesList"
          current-type=""
          :disabled="true"
          container-class="horizontal-container card profile-categories q-mb-sm"
        />
        <q-scroll-area class="scroll-area full-height fix-scroll-area" :visible="false">
          <div class="full-height full-width container">
            <q-skeleton type="rect" v-for="n in 5" :key="n" :height="randomSize(50, 250)" class="card" />
          </div>
        </q-scroll-area>
      </template>
    </closeable-content>
  </q-dialog>
</template>
<script setup lang="ts">
import { useDialogPluginComponent } from "quasar";
import UserAvatar from "../profile/UserAvatar.vue";
import CloseableContent from "../misc/CloseableContent.vue";
import CategoryButtonsContainer from "../categories/CategoryButtonsContainer.vue";
import { onMounted, ref, computed, defineAsyncComponent } from "vue";
import type { ButtonProps } from "../categories/CategoryButton.vue";
import { useI18n } from "vue-i18n";
import { useMainStore } from "src/stores/main-store";
import { useProfileStore } from "src/stores/profile-store";

const UserDialogInfo = defineAsyncComponent(() => import("./user-dialog/UserInfo.vue"));
const UserDialogPosts = defineAsyncComponent(() => import("./user-dialog/UserPosts.vue"));

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const { t } = useI18n();
const mainStore = useMainStore();
const profileStore = useProfileStore();
const meta = ref({});
const expand = ref(false);

const loaded = ref(false);

const props = defineProps<{
  user: User;
}>();

const userRef = ref(props.user);

const currentType = ref("info");
const categoriesList = computed<ButtonProps[]>(() => [
  {
    icon: "sym_r_info",
    label: t("info"),
    click: () => changeType("info"),
    type: "info"
  },
  {
    icon: "sym_r_article",
    label: t("posts"),
    click: () => changeType("posts"),
    type: "posts"
  }
]);

const changeType = (type: string) => {
  currentType.value = type;
};

const randomIntInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomSize = (min: number, max: number) => `${randomIntInRange(min, max)}px`;

onMounted(async () => {
  mainStore.openedDialogs.user();
  mainStore.openedDialogs.user = dialogRef.value!.hide;
  if (userRef.value.user_id != profileStore.profile?.user_id) {
    const profile = await profileStore.getProfile(userRef.value.user_id);
    if (profile) {
      userRef.value = profile;
    }
  } else {
    userRef.value = (await profileStore.getProfile()) || userRef.value;
  }
  loaded.value = true;
});
</script>
