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
      <div class="profile-info">
        <q-img :src="userRef.banner_url" class="card banner" />
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
      />
      <user-dialog-info :user="userRef" v-if="currentType == 'info'" :meta="meta" />
      <user-dialog-posts :user="userRef" v-else-if="currentType == 'posts'" :meta="meta" v-model:expand="expand" />
    </closeable-content>
  </q-dialog>
</template>
<script setup lang="ts">
import { useDialogPluginComponent } from "quasar";
import UserAvatar from "../profile/UserAvatar.vue";
import CloseableContent from "../misc/CloseableContent.vue";
import CategoryButtonsContainer from "../categories/CategoryButtonsContainer.vue";
import { onMounted, ref, computed, defineAsyncComponent } from "vue";
import { getProfile } from "src/api/users";
import type { ButtonProps } from "../categories/CategoryButton.vue";
import { useI18n } from "vue-i18n";
import { useMainStore } from "src/stores/main-store";

const UserDialogInfo = defineAsyncComponent(() => import("./UserInfo.vue"));
const UserDialogPosts = defineAsyncComponent(() => import("./UserPosts.vue"));

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const { t } = useI18n();
const mainStore = useMainStore();
const meta = ref({});
const expand = ref(false);

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

onMounted(async () => {
  mainStore.openedDialogs.user();
  mainStore.openedDialogs.user = dialogRef.value!.hide;
  const r = await getProfile(userRef.value.user_id);
  if (r.data.success) {
    userRef.value = r.data.data;
  }
});
</script>
