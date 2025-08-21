<template>
  <q-dialog
    transition-show="slide-up"
    transition-hide="slide-down"
    class="my-activity-dialog card-dialog with-sidebar"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
  >
    <closeable-content v-on:hide="dialogRef!.hide()">
      <div class="dialog-header horizontal-container">
        <div v-show="!isSmallScreen || current == 0" class="main-page-label horizontal-container label-container">
          <my-icon icon="browse_activity" class="header-icon" />
          <div class="label">{{ $t("my_activity") }}</div>
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
                :label="$t(item.labelKey)"
                :icon="item.icon"
                type="card"
                :is-category="true"
                :class="{ selected: item.key == selected && !isSmallScreen }"
                @click="setSelected(item.key)"
              />
            </template>
          </div>
        </transition>
        <transition name="scale" :css="isSmallScreen">
          <div class="view full-width full-height crossfade-div" v-show="!isSmallScreen || current == 1" key="view">
            <transition name="crossfade" :css="!isSmallScreen">
              <keep-alive>
                <main-view type="favorites" v-if="selected == 'favorites'" />
                <main-view type="liked" v-else-if="selected == 'liked'" />
                <main-view type="disliked" v-else-if="selected == 'disliked'" />
                <following-view v-else-if="selected == 'following'" />
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
import MyIcon from "src/components/my/MyIcon.vue";
import MyButton from "src/components/my/MyButton.vue";
import CloseableContent from "../misc/CloseableContent.vue";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const MainView = defineAsyncComponent(() => import("./MainView.vue"));
const FollowingView = defineAsyncComponent(() => import("./FollowingView.vue"));
type views = ["favorites", "liked", "disliked", "following"];

const screenSize = ref(window.innerWidth);
const isSmallScreen = computed(() => screenSize.value < 750);
const current = ref(0);

const selected = ref<views[number]>("favorites");

const items = [
  {
    labelKey: "favorites",
    key: "favorites",
    icon: "favorite"
  },
  {
    labelKey: "liked",
    key: "liked",
    icon: "thumb_up"
  },
  {
    labelKey: "disliked",
    key: "disliked",
    icon: "thumb_down"
  },
  {
    labelKey: "following",
    key: "following",
    icon: "group"
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
