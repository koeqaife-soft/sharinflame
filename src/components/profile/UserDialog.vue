<template>
  <q-dialog
    transition-show="slide-up"
    transition-hide="slide-down"
    class="user-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
  >
    <closeable-content v-on:hide="dialogRef!.hide()" :class="{ expand: expand }">
      <template v-if="loaded">
        <div class="profile-info">
          <template v-if="userRef.banner_url">
            <my-image :src="userRef.banner_url" class="card banner" />
          </template>
          <template v-else>
            <div class="card banner" />
          </template>
          <my-button class="close" icon="close" @click="dialogRef?.hide" />
          <div class="profile-inner">
            <user-avatar :user="userRef" />
            <div class="container name-container">
              <div class="display-name">{{ userRef.display_name || userRef.username }}</div>
              <div class="username">@{{ userRef.username }}</div>
            </div>
            <q-space />
            <my-button
              :label="userRef.followed ? $t('unfollow') : $t('follow')"
              icon="add"
              class="follow-button"
              :type="userRef.followed ? 'outlined' : 'primary'"
              @click="followButton"
              v-if="!isMe"
            />
            <my-button
              type="primary"
              :label="$t('edit')"
              icon-right="person_edit"
              class="edit-profile-button"
              @click="editProfile"
              v-else
            />
          </div>
        </div>
        <category-buttons
          :categories-list="categoriesList"
          :current-type="currentType"
          container-class="horizontal-container card profile-categories q-mb-sm"
          style="z-index: 2"
        />
        <keep-alive>
          <user-dialog-info :user="userRef" v-if="currentType == 'info'" :meta="meta" />
          <user-dialog-posts :user="userRef" v-else-if="currentType == 'posts'" :meta="meta" v-model:expand="expand" />
        </keep-alive>
      </template>
      <template v-else>
        <div class="profile-info">
          <rect-skeleton class="card banner" />
          <my-button class="close" icon="close" @click="dialogRef?.hide" />
          <div class="profile-inner">
            <q-skeleton type="QAvatar" class="avatar" />
            <div class="container name-container">
              <rect-skeleton class="display-name" width="120px" height="25px" />
              <rect-skeleton class="username" width="120px" height="21px" />
            </div>
          </div>
        </div>
        <category-buttons
          :categories-list="categoriesList"
          current-type=""
          :disabled="true"
          container-class="horizontal-container card profile-categories q-mb-sm"
        />
        <q-scroll-area class="scroll-area full-height fix-scroll-area" :visible="false">
          <div class="full-height full-width container">
            <rect-skeleton v-for="n in 5" :key="n" :height="randomSize(50, 250)" class="card" />
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
import CategoryButtons from "src/components/misc/CategoryButtons.vue";
import MyButton from "../my/MyButton.vue";
import RectSkeleton from "../skeletons/RectSkeleton.vue";
import MyImage from "../my/MyImage.vue";
import { onMounted, ref, computed, defineAsyncComponent } from "vue";
import type { ButtonProps } from "src/components/misc/CategoryButtons.vue";
import { useI18n } from "vue-i18n";
import { useMainStore } from "src/stores/main-store";
import { useProfileStore } from "src/stores/profile-store";
import { randomSize } from "src/utils/random";
import { follow, unfollow } from "src/api/users";

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
const isMe = ref(false);

const props = defineProps<{
  user: User;
  notSync?: boolean;
}>();

const userRef = ref(props.user);

const currentType = ref("info");
const categoriesList = computed<ButtonProps[]>(() => [
  {
    icon: "info",
    label: t("info"),
    click: () => changeType("info"),
    type: "info"
  },
  {
    icon: "article",
    label: t("posts"),
    click: () => changeType("posts"),
    type: "posts"
  }
]);

async function followButton() {
  const followed = userRef.value.followed;
  try {
    if (followed) {
      delete userRef.value.followed;
      userRef.value.followers_count ??= 0;
      userRef.value.followers_count -= 1;
      await unfollow(userRef.value.user_id);
    } else {
      userRef.value.followed = true;
      userRef.value.followers_count ??= 0;
      userRef.value.followers_count += 1;
      await follow(userRef.value.user_id);
    }
  } catch {
    if (followed) userRef.value.followed = true;
    else delete userRef.value.followed;
  }
}

const changeType = (type: string) => {
  currentType.value = type;
};

function editProfile() {
  mainStore.openDialog("settings", "", { open: "profile" });
}

onMounted(async () => {
  if (props.notSync) {
    userRef.value = props.user;
    isMe.value = userRef.value.user_id == profileStore.profile?.user_id;
  } else if (userRef.value?.user_id != profileStore.profile?.user_id) {
    const profile = await profileStore.getProfile(userRef.value?.user_id);
    if (profile) {
      userRef.value = profile;
    }
  } else {
    isMe.value = true;
    userRef.value = (await profileStore.getProfile()) || userRef.value;
  }
  loaded.value = true;
});
</script>
