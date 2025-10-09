<template>
  <q-scroll-area class="scroll-area fix-scroll-area full-height appearance-view">
    <div class="container">
      <div class="card container">
        <div class="horizontal-container">
          <my-icon class="label-icon" icon="dark_mode" />
          <div class="label">{{ $t("theme") }}</div>
        </div>
        <div class="theme-container horizontal-container">
          <my-segment-btn :items="modes" v-model="selectedMode" />
          <my-segment-btn :items="themes" v-model="selectedTheme" />
        </div>
      </div>
      <div class="card container">
        <div class="horizontal-container">
          <my-icon class="label-icon" icon="palette" />
          <div class="label">{{ $t("color") }}</div>
        </div>
        <div class="slider-container" :style="{ '--current-color': currentColor }">
          <input
            type="range"
            class="hue-slider"
            min="1"
            max="360"
            :style="{ background: backgroundStyle }"
            ref="sliderRef"
          />
        </div>
        <div class="horizontal-container colors-container">
          <my-button
            v-for="(color, index) in predefinedColorsHex"
            :key="index"
            type="card"
            :style="{ background: color }"
            class="color-button"
            @click="onButtonColor(index)"
          />
        </div>
      </div>
      <toggle-card
        label-key="star_background_setting"
        icon="stars"
        v-if="$q.platform.is.desktop"
        v-model="starBackground"
      />
      <toggle-card label-key="toolbar_use_alt_setting" icon="toolbar" v-model="toolbarUseAlt" />
    </div>
  </q-scroll-area>
</template>
<script setup lang="ts">
import { useQuasar } from "quasar";
import MySegmentBtn from "src/components/my/MySegmentBtn.vue";
import MyIcon from "src/components/my/MyIcon.vue";
import MyButton from "src/components/my/MyButton.vue";
import ToggleCard from "src/components/misc/ToggleCard.vue";
import { useMainStore } from "src/stores/main-store";
import { generateHueSteps, generateOneColor } from "src/utils/colors";
import { onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

const quasar = useQuasar();
const mainStore = useMainStore();

const modes = ref([
  {
    labelKey: "dark",
    iconLeft: "dark_mode",
    key: "dark"
  },
  {
    labelKey: "light",
    iconLeft: "light_mode",
    key: "light"
  },
  {
    labelKey: "auto",
    iconLeft: "sync",
    key: "auto"
  }
]);
const themes = ref([
  {
    labelKey: "default",
    iconLeft: "star",
    key: "default"
  },
  {
    labelKey: "mono",
    iconLeft: "filter_b_and_w",
    key: "monochrome"
  },
  {
    labelKey: "contrast",
    iconLeft: "contrast",
    key: "contrast"
  }
]);

const currentColor = ref("");
const selectedMode = ref("");
const selectedTheme = ref(mainStore.getSetting("currentTheme"));
const starBackground = ref(mainStore.getSetting("starBackground"));
const toolbarUseAlt = ref(mainStore.getSetting("toolbarUseAlt"));

const predefinedColors = [8, 45, 120, 150, 180, 230, 320];
const predefinedColorsHex = ref<string[]>([]);

const generatedRanges = reactive({
  dark: "",
  light: ""
});

const generatedColors: Record<"dark" | "light", Record<string, string>> = {
  dark: {},
  light: {}
};

const backgroundStyle = ref("");
const sliderRef = ref<HTMLInputElement | null>(null);

function updatePredefinedColors() {
  predefinedColorsHex.value.length = 0;
  predefinedColors.forEach((v) => {
    predefinedColorsHex.value.push(generateOneColor([v, 0, 0], "primary", quasar.dark.isActive));
  });
}

function updateRangeStyle() {
  const hueStep = 5;
  const key = quasar.dark.isActive ? "dark" : "light";

  if (generatedRanges[key].length === 0) {
    const colors = generateHueSteps([0, 0, 0], "primary", hueStep, quasar.dark.isActive);
    const gradient = `linear-gradient(to right, ${colors.join(", ")})`;
    for (let i = 0; i <= 360; i += hueStep) {
      generatedColors[key][i] = colors[Math.floor(i / hueStep)] ?? "#000";
    }

    generatedRanges[key] = gradient;
  }
  backgroundStyle.value = generatedRanges[key];
}

watch(starBackground, (v) => {
  mainStore.setSettings("starBackground", v);
});

watch(toolbarUseAlt, (v) => {
  mainStore.setSettings("toolbarUseAlt", v);
});

watch(selectedMode, (v) => {
  if (v !== quasar.dark.mode) {
    if (v == "auto") quasar.dark.set(v);
    else quasar.dark.set(v == "dark");
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
    updatePredefinedColors();
  },
  { immediate: true }
);

function onButtonColor(index: number) {
  document.body.classList.add("no-animate");
  mainStore.updateColor(false, predefinedColors[index], true);
  sliderRef.value!.value = String(mainStore.getSetting("themeHue"));
  setTimeout(() => {
    document.body.classList.remove("no-animate");
  }, 1);
}

function onSliderChange() {
  document.body.classList.add("no-animate");
  mainStore.updateColor(false, Number(sliderRef.value!.value), true);
  currentColor.value = "";
  sliderRef.value!.value = String(mainStore.getSetting("themeHue"));
  setTimeout(() => {
    document.body.classList.remove("no-animate");
  }, 1);
}

function findNearestStep(value: number, step: number): number {
  return Math.floor(value / step) * step;
}

function onSliderInput() {
  const rawValue = Number(sliderRef.value!.value);
  const nearestValue = findNearestStep(rawValue, 5);
  currentColor.value = generatedColors[quasar.dark.isActive ? "dark" : "light"][nearestValue] || currentColor.value;
}

onMounted(() => {
  sliderRef.value?.addEventListener("change", onSliderChange, { passive: true });
  sliderRef.value?.addEventListener("input", onSliderInput, { passive: true });
  sliderRef.value!.value = String(mainStore.getSetting("themeHue"));
});

onBeforeUnmount(() => {
  sliderRef.value?.removeEventListener("change", onSliderChange);
  sliderRef.value?.removeEventListener("input", onSliderInput);
  document.body.classList.remove("no-animate");
});
</script>
