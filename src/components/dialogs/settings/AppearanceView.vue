<template>
  <q-scroll-area class="scroll-area fix-scroll-area full-height appearance-view">
    <div class="container">
      <div class="card container">
        <div class="horizontal-container">
          <q-icon class="label-icon" name="sym_r_dark_mode" />
          <div class="label">{{ $t("theme") }}</div>
        </div>
        <div class="theme-container horizontal-container">
          <my-segment-btn :items="modes" v-model="selectedMode" />
          <my-segment-btn :items="themes" v-model="selectedTheme" />
        </div>
      </div>
      <div class="card container">
        <div class="horizontal-container">
          <q-icon class="label-icon" name="sym_r_palette" />
          <div class="label">{{ $t("color") }}</div>
        </div>
        <div class="slider-container">
          <input
            type="range"
            class="hue-slider"
            min="1"
            max="360"
            :value="mainStore.getSetting('themeHue')"
            :style="{ background: backgroundStyle }"
            ref="sliderRef"
          />
        </div>
      </div>
    </div>
  </q-scroll-area>
</template>
<script setup lang="ts">
import { useQuasar } from "quasar";
import MySegmentBtn from "src/components/misc/MySegmentBtn.vue";
import { useMainStore } from "src/stores/main-store";
import { generateHueSteps } from "src/utils/colors";
import { onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

const quasar = useQuasar();
const mainStore = useMainStore();

const modes = ref([
  {
    labelKey: "dark",
    iconLeft: "sym_r_dark_mode",
    key: "dark"
  },
  {
    labelKey: "light",
    iconLeft: "sym_r_light_mode",
    key: "light"
  },
  {
    labelKey: "auto",
    iconLeft: "sym_r_sync",
    key: "auto"
  }
]);
const themes = ref([
  {
    labelKey: "default",
    iconLeft: "sym_r_star",
    key: "default"
  },
  {
    labelKey: "contrast",
    iconLeft: "sym_r_contrast",
    key: "monochrome"
  }
]);
const selectedMode = ref("");
const selectedTheme = ref(mainStore.getSetting("currentTheme"));

const generatedRanges = reactive({
  dark: "",
  light: ""
});

const backgroundStyle = ref("");
const sliderRef = ref<HTMLInputElement | null>(null);

function updateRangeStyle() {
  const key = quasar.dark.isActive ? "dark" : "light";

  if (generatedRanges[key].length === 0) {
    const colors = generateHueSteps([0, 0, 0], "primary", 1, quasar.dark.isActive);
    const gradient = `linear-gradient(to right, ${colors.join(", ")})`;
    generatedRanges[key] = gradient;
  }
  backgroundStyle.value = generatedRanges[key];
}

watch(selectedMode, (v) => {
  if (v !== quasar.dark.mode) {
    if (v == "auto") quasar.dark.set(v);
    else quasar.dark.set(v == "dark");
    mainStore.setSettings("darkMode", quasar.dark.mode);
  }
});

watch(selectedTheme, (v) => {
  document.body.classList.add("no-animate");
  mainStore.updateColor(false, undefined, true, v);
  setTimeout(() => {
    document.body.classList.remove("no-animate");
  }, 1);
});

watch(
  () => quasar.dark.mode,
  (v) => {
    if (v == "auto") selectedMode.value = "auto";
    else if (v === true) selectedMode.value = "dark";
    else selectedMode.value = "light";
    updateRangeStyle();
  },
  { immediate: true }
);

function onSliderChange() {
  document.body.classList.add("no-animate");
  mainStore.updateColor(false, Number(sliderRef.value!.value), true);
  setTimeout(() => {
    document.body.classList.remove("no-animate");
  }, 1);
}

onMounted(() => {
  sliderRef.value?.addEventListener("change", onSliderChange, { passive: true });
});

onBeforeUnmount(() => {
  sliderRef.value?.removeEventListener("change", onSliderChange);
  document.body.classList.remove("no-animate");
});
</script>
