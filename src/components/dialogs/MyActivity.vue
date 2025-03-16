<template>
  <q-dialog
    transition-show="scale"
    transition-hide="scale"
    class="my-activity-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
  >
    <div class="dialog-content">
      <div class="card-dialog-header horizontal-container">
        <div v-show="!isSmallScreen || current == 0" class="main-page-label horizontal-container label-container">
          <q-icon name="sym_r_browse_activity" class="header-icon" />
          <div class="label">{{ $t("my_activity") }}</div>
        </div>
        <div v-show="isSmallScreen && current == 1" class="inner-page-label horizontal-container label-container">
          <q-btn flat round icon="sym_r_arrow_back" @click="() => (current = 0)" />
          <div class="label">{{ $t(getItemByKey(selected).key) }}</div>
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
              <main-view type="favorites" v-if="selected == 'favorites'" />
              <main-view type="liked" v-else-if="selected == 'liked'" />
              <main-view type="disliked" v-else-if="selected == 'disliked'" />
              <following-view v-else-if="selected == 'following'" />
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

const MainView = defineAsyncComponent(() => import("./my-activity/MainView.vue"));
const FollowingView = defineAsyncComponent(() => import("./my-activity/FollowingView.vue"));
type views = ["favorites", "liked", "disliked", "following"];

const screenSize = ref(window.innerWidth);
const isSmallScreen = computed(() => screenSize.value < 750);
const current = ref(0);

const selected = ref<views[number]>("favorites");

const items = [
  {
    labelKey: "favorites",
    key: "favorites",
    icon: "sym_r_favorite"
  },
  {
    labelKey: "liked",
    key: "liked",
    icon: "sym_r_thumb_up"
  },
  {
    labelKey: "disliked",
    key: "disliked",
    icon: "sym_r_thumb_down"
  },
  {
    labelKey: "following",
    key: "following",
    icon: "sym_r_group"
  }
] as const;

type ItemKey = (typeof items)[number]["key"];

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
