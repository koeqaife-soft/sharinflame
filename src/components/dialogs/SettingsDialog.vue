<template>
  <q-dialog
    transition-show="scale"
    transition-hide="scale"
    class="settings-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
  >
    <div class="dialog-content">
      <div class="card-dialog-header horizontal-container">
        <div v-show="!isSmallScreen || current == 0" class="main-page-label horizontal-container label-container">
          <q-icon name="sym_r_settings" class="header-icon" />
          <div class="label">{{ $t("settings") }}</div>
        </div>
        <div v-show="isSmallScreen && current == 1" class="inner-page-label horizontal-container label-container">
          <q-btn flat round icon="sym_r_arrow_back" @click="() => (current = 0)" />
          <div class="label">{{ $t(getItemByKey(selected).labelKey) }}</div>
        </div>
        <q-space />
        <q-btn flat round icon="sym_r_close" @click="dialogRef?.hide()" />
      </div>
      <div class="dialog-content-inner horizontal-container">
        <transition name="scale" :css="isSmallScreen">
          <div class="sidebar container" v-show="!isSmallScreen || current == 0">
            <template v-for="(item, index) in items" :key="index">
              <q-btn
                :label="$t(item.labelKey)"
                :icon="item.icon"
                no-caps
                unelevated
                class="card-button category-button"
                :class="{ selected: item.key == selected && !isSmallScreen }"
                @click="setSelected(item.key)"
              />
            </template>
          </div>
        </transition>
        <transition name="scale" :css="isSmallScreen">
          <div class="view full-width full-height" v-show="!isSmallScreen || current == 1" key="view">
            <keep-alive>
              <account-view v-if="showIf('my_account')" />
            </keep-alive>
          </div>
        </transition>
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import { useDialogPluginComponent } from "quasar";
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from "vue";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const AccountView = defineAsyncComponent(() => import("./settings/AccountView.vue"));
type views = ["my_account"];

const screenSize = ref(window.innerWidth);
const isSmallScreen = computed(() => screenSize.value < 750);
const current = ref(0);

const selected = ref<views[number]>("my_account");

const items = [
  {
    labelKey: "my_account",
    key: "my_account",
    icon: "sym_r_person"
  }
] as const;

type ItemKey = (typeof items)[number]["key"];

// Do not first view immediately (bug with autogrow fields)
const showIf = (key: string) => selected.value == key && (!isSmallScreen.value || current.value == 1);

const updateScreenSize = () => (screenSize.value = window.innerWidth);
const getItemByKey = (key: ItemKey) => items.find((item) => item.key === key)!;
function setSelected(value: views[number]) {
  selected.value = value;
  current.value = 1;
}

onMounted(() => {
  updateScreenSize();
  window.addEventListener("resize", updateScreenSize, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateScreenSize);
});
</script>
