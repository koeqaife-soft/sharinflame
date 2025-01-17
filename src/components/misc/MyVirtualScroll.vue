<template>
  <div class="virtual-scroll" ref="scrollContainer">
    <q-scroll-observer @scroll="onScroll" :debounce="debounce" />
    <div class="virtual-scroll-content" ref="scrollContent">
      <div class="virtual-filler-top" :style="{ height: `${topFillerHeight}px` }" />
      <template v-for="(item, index) in showedItems" :key="getItemKey(item)">
        <div class="virtual-item" v-if="index >= visibleIndexes[0]! && index <= visibleIndexes[1]!">
          <q-resize-observer @resize="(event) => onItemHeightChange(index, item, event)" />
          <slot :item="item" :index="index" />
        </div>
      </template>
      <div class="virtual-filler-bottom" :style="{ height: `${bottomFillerHeight}px` }" />
    </div>
    <div
      class="virtual-scroll-loading"
      :class="{ invisible: !showLoadingSlot }"
      v-if="!stopInfiniteLoad && infiniteLoadType === 'bottom'"
      ref="loadingRef"
    >
      <slot name="loading" />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
// NOTE: I didn't add infinite load type "top" because there's many problems with it
import { computed, nextTick, onBeforeUnmount, onMounted, onUnmounted, Ref, ref, watch } from "vue";

interface Props {
  items: T[];
  margins?: number;
  offset?: number;
  bottomOffset?: number;
  debounce?: number;
  virtualDebounce?: number;
  itemKey: keyof T;
  infiniteLoadType?: "bottom" | "none";
  defaultHeight?: number;
}

const props = withDefaults(defineProps<Props>(), {
  margins: 0,
  offset: 250,
  bottomOffset: 500,
  debounce: 50,
  defaultHeight: 125,
  infiniteLoadType: "none"
});

const emit = defineEmits<{
  (e: "loadMore", index: number, done: (stop?: boolean) => void): void;
}>();

defineExpose({ updateShowedItems });

const heights: (number | undefined)[] = [];

type KeyType = string | number | symbol;
const keyHeights: Record<KeyType, number> = {};

const containerHeight = ref(0);

const scrollContent = ref<HTMLElement | null>(null);
const scrollContainer = ref<HTMLElement | null>(null);
const loadingRef = ref<HTMLElement | null>(null);

const top = ref(0);
const bottom = computed(() => top.value + containerHeight.value + props.offset + props.bottomOffset);

const topFillerHeight = ref(0);
const bottomFillerHeight = ref(0);

const fastScrollDelta = computed(() => 900 * (Math.log2(props.debounce + 1) / Math.log2(150 + 1)));

const visibleIndexes = ref<number[]>([]);

const showedItems: Ref<T[]> = ref([]);
let showedItemsTickLock = false;

const isLoading = ref(false);
const stopInfiniteLoad = ref(false);

const isContentVisible = ref(false);

let isLoadingTimeout: NodeJS.Timeout | undefined = undefined;
const showLoading = ref(false);

const showLoadingSlot = computed(() => isLoading.value && showLoading.value);

function updateSvgAnimations(isRetry?: boolean) {
  if (renderLoadingSlot.value === true) {
    if (loadingRef.value === null) {
      isRetry !== true &&
        nextTick(() => {
          updateSvgAnimations(true);
        });
      return;
    }

    const isVisible = showLoadingSlot.value;

    const action = `${isVisible === true ? "un" : ""}pauseAnimations` as const;
    Array.from(loadingRef.value.getElementsByTagName("svg")).forEach((el) => {
      el[action]();
    });
  }
}

const renderLoadingSlot = computed(() => props.infiniteLoadType === "bottom" && !stopInfiniteLoad.value === true);

watch([isLoading, showLoadingSlot, renderLoadingSlot], () => {
  updateSvgAnimations();
});

watch(isContentVisible, () => {
  updateVisibleItems();
  checkLoading();
});

watch(
  props.items,
  () => {
    if (props.infiniteLoadType === "none" || !isLoading.value) updateShowedItems();
  },
  { deep: true }
);

const getItemKey = (item: T) => {
  return item[props.itemKey];
};

function updateShowedItems() {
  if (showedItemsTickLock) return;
  showedItemsTickLock = true;
  nextTick(() => {
    try {
      const newHeights: (number | undefined)[] = [];

      props.items.forEach((item: T, index: number) => {
        const key = getItemKey(item) as KeyType;

        if (key in keyHeights) newHeights[index] = keyHeights[key]!;
        else newHeights[index] = undefined;
      });

      heights.length = 0;
      heights.push(...newHeights);

      showedItems.value = { ...props.items };
    } finally {
      showedItemsTickLock = false;
      showLoading.value = false;
    }
  });
}

function checkLoading() {
  if (isLoading.value || stopInfiniteLoad.value) return;
  if (!isContentVisible.value || !scrollContent.value) return;

  const loadMore = () => {
    if (isLoading.value) return;
    isLoading.value = true;

    emit("loadMore", props.items.length - 1, (stop?: boolean) => {
      isLoading.value = false;
      if (stop) stopInfiniteLoad.value = true;

      if (isLoadingTimeout) {
        clearTimeout(isLoadingTimeout);
        isLoadingTimeout = undefined;
      }

      updateShowedItems();
      updateVisibleItems();
    });
  };

  if (props.infiniteLoadType === "bottom" && bottom.value >= (scrollContent.value?.offsetHeight || 0)) {
    if (isLoadingTimeout) {
      clearTimeout(isLoadingTimeout);
      isLoadingTimeout = undefined;
    }
    isLoadingTimeout = setTimeout(() => {
      showLoading.value = true;
      isLoadingTimeout = undefined;
    }, 150);
    loadMore();
  }
}

let updateLock = false;
let updateVisibleDebounce: NodeJS.Timeout | null = null;
let generatedCumulativeHeights: number[] = [];
let lastPosition = 0;

function generateCumulativeHeights(heights: (number | undefined)[]) {
  const cumulativeHeights = [];
  let cumulativeHeight = 0;

  for (let i = 0; i < heights.length; i++) {
    const itemHeight = heights[i] ?? props.defaultHeight;
    cumulativeHeight += itemHeight;
    cumulativeHeights.push(cumulativeHeight);
  }

  return cumulativeHeights;
}

function updateVisibleItems(fullUpdate = true, noDebounce = false) {
  const func = () =>
    nextTick(() => {
      if (updateLock || !scrollContainer.value?.checkVisibility()) return;
      updateLock = true;
      let topIndex = -1;
      let bottomIndex = -1;
      const lastTopIndex = visibleIndexes.value[0];
      const lastBottomIndex = visibleIndexes.value[1];

      const update = (h: number[], endIndex?: number, startIndex?: number) => {
        const end = (endIndex && endIndex + 1) || h.length;
        const start = startIndex || 0;
        for (let i = start; i < end; i++) {
          const currentHeight = h[i]!;

          if (topIndex === -1 && top.value < currentHeight) {
            topIndex = i;
          }

          if (bottom.value <= currentHeight) {
            bottomIndex = i;
            break;
          }
        }
        if (bottomIndex === -1) bottomIndex = end - 1;
      };

      if (fullUpdate || lastTopIndex === undefined || lastBottomIndex === undefined || !generatedCumulativeHeights) {
        const cumulativeHeights = generateCumulativeHeights(heights);
        generatedCumulativeHeights = cumulativeHeights;
        update(cumulativeHeights);
      } else {
        if (top.value < lastPosition) update(generatedCumulativeHeights, lastBottomIndex, undefined);
        else update(generatedCumulativeHeights, undefined, lastTopIndex);
      }

      visibleIndexes.value = [topIndex, bottomIndex];

      if (lastTopIndex != topIndex)
        topFillerHeight.value = heights
          .slice(0, topIndex)
          .reduce((acc, height) => (acc || props.defaultHeight) + (height || 0), 0)!;
      if (lastBottomIndex != bottomIndex)
        bottomFillerHeight.value = heights
          .slice(bottomIndex + 1)
          .reduce((acc, height) => (acc || props.defaultHeight) + (height || 0), 0)!;

      updateLock = false;
      lastPosition = top.value;
    });
  if (noDebounce && props.virtualDebounce) {
    if (updateVisibleDebounce) clearTimeout(updateVisibleDebounce);
    updateVisibleDebounce = setTimeout(func, props.virtualDebounce);
  } else func();
}

let updateDebounce: NodeJS.Timeout | null = null;

function onScroll(info: QScrollObserverDetails) {
  if (!scrollContainer.value?.checkVisibility()) return;
  top.value = Math.max(info.position.top - props.offset, 0);

  checkLoading();
  const delta = Math.abs(info.delta.top);

  if (delta >= fastScrollDelta.value) {
    if (updateDebounce) {
      clearTimeout(updateDebounce);
      updateDebounce = null;
    }
    updateDebounce = setTimeout(() => updateVisibleItems(false), 250);
  } else {
    if (updateDebounce) {
      clearTimeout(updateDebounce);
      updateDebounce = null;
    }
    updateVisibleItems(false);
  }
}

function onResize() {
  if (!scrollContainer.value?.checkVisibility()) return;
  containerHeight.value = window.innerHeight;
  if (!updateDebounce) {
    updateVisibleItems(false);
    checkLoading();
  }
}

function onItemHeightChange(index: number, item: T, info: { height: number; width: number }) {
  if (!scrollContainer.value?.checkVisibility()) return;
  const height = info.height + (props.margins || 0);

  keyHeights[getItemKey(item) as KeyType] = height;
  if (heights[index] !== height) {
    heights[index] = height;
    updateVisibleItems();
  }
}

let requestNumber: number;
let lastUpdateTime = 0;

const checkVisibility = () => {
  const now = Date.now();
  if (now - lastUpdateTime > (isContentVisible.value ? 500 : 100)) {
    let lastValue = isContentVisible.value;
    isContentVisible.value = scrollContainer.value?.checkVisibility() || false;
    if (lastValue != isContentVisible.value) updateVisibleItems();
    lastUpdateTime = now;
  }
  requestAnimationFrame(checkVisibility);
};

onMounted(() => {
  nextTick(() => {
    if (scrollContainer.value) {
      containerHeight.value = window.innerHeight;
    }
    updateVisibleItems();
    checkLoading();
  });
});

onMounted(() => {
  window.addEventListener("resize", onResize);
  onResize();

  showedItems.value = { ...props.items };

  requestNumber = requestAnimationFrame(checkVisibility);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(requestNumber);
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
});
</script>
