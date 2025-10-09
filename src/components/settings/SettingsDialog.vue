<template>
  <q-dialog
    transition-show="slide-up"
    transition-hide="slide-down"
    class="settings-dialog card-dialog with-sidebar"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
  >
    <closeable-content v-on:hide="dialogRef!.hide()">
      <div class="dialog-header horizontal-container">
        <div v-show="!isSmallScreen || current == 0" class="main-page-label horizontal-container label-container">
          <my-icon icon="settings" class="header-icon" />
          <div class="label">{{ $t("settings") }}</div>
        </div>
        <div v-show="isSmallScreen && current == 1" class="inner-page-label horizontal-container label-container">
          <my-button icon="arrow_back" @click="() => (current = 0)" />
          <div class="label">{{ $t(getItemByKey(selected).labelKey) }}</div>
        </div>
        <q-space />
        <my-button icon="close" @click="dialogRef?.hide()" />
      </div>
      <div class="dialog-content-inner horizontal-container">
        <transition name="scale" :css="isSmallScreen">
          <div class="sidebar container" v-show="!isSmallScreen || current == 0">
            <template v-for="(item, index) in items" :key="index">
              <my-button
                type="card"
                :is-category="true"
                :label="$t(item.labelKey)"
                :icon="item.icon"
                :class="{ selected: item.key == selected && !isSmallScreen }"
                @click="setSelected(item.key)"
              />
            </template>
            <q-separator />
            <my-button :label="$t('logout')" icon="logout" type="flat" @click="onLogout" />
          </div>
        </transition>
        <transition name="scale" :css="isSmallScreen">
          <div
            class="view full-width full-height"
            :class="{ 'crossfade-div': !isSmallScreen }"
            v-show="!isSmallScreen || current == 1"
            key="view"
          >
            <transition name="crossfade" :css="!isSmallScreen">
              <keep-alive>
                <profile-view v-if="showIf('profile')" />
                <appearance-view v-else-if="showIf('appearance')" />
                <account-view v-else-if="showIf('account')" />
              </keep-alive>
            </transition>
          </div>
        </transition>
      </div>
    </closeable-content>
  </q-dialog>
</template>
<script setup lang="ts">
import { useDialogPluginComponent } from "quasar";
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from "vue";
import MyButton from "src/components/my/MyButton.vue";
import MyIcon from "src/components/my/MyIcon.vue";
import CloseableContent from "../misc/CloseableContent.vue";
import { clientLogout, logout } from "src/api/auth";
import { useMainStore } from "src/stores/main-store";

const props = defineProps<{
  open?: views[number];
}>();

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const ProfileView = defineAsyncComponent(() => import("./ProfileView.vue"));
const AppearanceView = defineAsyncComponent(() => import("./AppearanceView.vue"));
const AccountView = defineAsyncComponent(() => import("./AccountView.vue"));
type views = ["profile", "appearance", "account"];

const mainStore = useMainStore();
const screenSize = ref(window.innerWidth);
const isSmallScreen = computed(() => screenSize.value < 750);
const current = ref(props.open ? 1 : 0);

const selected = ref<views[number]>(props.open ?? "profile");

const items = [
  {
    labelKey: "profile",
    key: "profile",
    icon: "person"
  },
  {
    labelKey: "account",
    key: "account",
    icon: "shield_person"
  },
  {
    labelKey: "appearance",
    key: "appearance",
    icon: "palette"
  }
] as const;

type ItemKey = (typeof items)[number]["key"];

// Do not show first view immediately (bug with autogrow fields)
const showIf = (key: views[number]) => selected.value == key && (!isSmallScreen.value || current.value == 1);

const updateScreenSize = () => (screenSize.value = window.innerWidth);
const getItemByKey = (key: ItemKey) => items.find((item) => item.key === key)!;
function setSelected(value: views[number]) {
  selected.value = value;
  current.value = 1;
}

async function onLogoutOk() {
  try {
    await logout();
  } catch {
    // noop
  }
  clientLogout();
}

function onLogout() {
  mainStore.openDialog(
    "okCancel",
    "",
    {
      localeKey: "logout_dialog",
      okKey: "yes",
      cancelKey: "no",
      okType: "attention"
    },
    () => void onLogoutOk()
  );
}

onMounted(() => {
  updateScreenSize();
  window.addEventListener("resize", updateScreenSize, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateScreenSize);
});
</script>
