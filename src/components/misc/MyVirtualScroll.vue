<template>
  <div class="virtual-scroll" ref="scrollContainer">
    <q-scroll-observer @scroll="onScroll" :debounce="debounce" />
    <div class="virtual-scroll-content" ref="scrollContent">
      <div class="virtual-filler-top" :style="{ height: `${fillersHeight[0]}px` }" />

      <template v-for="(item, i) in visibleItems" :key="getItemKey(item)">
        <div
          class="virtual-item"
          :data-index="visibleIndexes[0] + i"
          :ref="
            (el) => {
              if (el && resizeObserver) divs[visibleIndexes[0] + i] = el as Element;
            }
          "
        >
          <slot :item="item" :index="visibleIndexes[0] + i" />
        </div>
      </template>

      <div class="virtual-filler-bottom" :style="{ height: `${fillersHeight[1]}px` }" />
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
import { computed, onBeforeUnmount, onBeforeUpdate, onMounted, nextTick, ref, watch, type Ref } from "vue";

interface Props {
  items: T[];
  margins?: number;
  offset?: number;
  bottomOffset?: number;
  debounce?: number;
  virtualDebounce?: number;
  itemKey: keyof T;
  infiniteLoadType?: "bottom" | "none";
  minItemHeight?: number;
  noResizeObserver?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  margins: 0,
  offset: 250,
  bottomOffset: 250,
  debounce: 25,
  minItemHeight: 125,
  infiniteLoadType: "none"
});

const emit = defineEmits<{
  (e: "loadMore", index: number, done: (stop?: boolean) => void): void;
  (e: "scroll", info: QScrollObserverDetails): void;
}>();

defineExpose({ updateShowedItems });

// -------------------------
// REACTIVE STATE VARIABLES
// -------------------------
const scrollContent = ref<HTMLElement | null>(null);
const scrollContainer = ref<HTMLElement | null>(null);
const loadingRef = ref<HTMLElement | null>(null);

const containerHeight = ref(window.innerHeight);
const scrollPosition = ref(0);
const top = ref(0);
const bottom = ref(0);
const fillersHeight = ref([0, 0]);
const visibleIndexes: Ref<[number, number]> = ref([0, 0]);

const showedItems: Ref<T[]> = ref([]);
const visibleItems = computed(() => showedItems.value.slice(visibleIndexes.value[0], visibleIndexes.value[1] + 1));

type KeyType = string | number | symbol;
const keyHeights: Record<KeyType, number> = {};
const heights: Ref<(number | undefined)[]> = ref([]);

const isLoading = ref(false);
const stopInfiniteLoad = ref(false);
const showLoading = ref(false);
const showLoadingSlot = computed(() => isLoading.value && showLoading.value);
// -------------------------
// HELPERS & UTILS
// -------------------------

function binarySearch(arr: number[], value: number) {
  let low = 0,
    high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid]! < value) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return low;
}

function generateCumulativeHeights() {
  let total = 0;
  return heights.value.map((h) => {
    total += (h ?? props.minItemHeight) + props.margins;
    return total;
  });
}

let generatedCumulativeHeights: number[] = [];
function updateVisibleItems() {
  const startIdx = binarySearch(generatedCumulativeHeights, top.value);
  const endIdx = binarySearch(generatedCumulativeHeights, bottom.value);
  visibleIndexes.value[0] = Math.max(startIdx - 12, 0);
  visibleIndexes.value[1] = Math.min(endIdx + 8, heights.value.length - 1);
  fillersHeight.value[0] = generatedCumulativeHeights[visibleIndexes.value[0] - 1] ?? 0;
  fillersHeight.value[1] =
    (generatedCumulativeHeights[heights.value.length - 1] ?? 0) -
    (generatedCumulativeHeights[visibleIndexes.value[1]] ?? 0);
}

function updateShowedItems() {
  heights.value = props.items.map((item) => keyHeights[getItemKey(item)] ?? undefined);
  generatedCumulativeHeights = generateCumulativeHeights();
  showedItems.value = props.items;
  updateVisibleItems();
}

const getItemKey = (item: T) => item[props.itemKey] as KeyType;

// -------------------------
// SCROLL & RESIZE HANDLERS
// -------------------------
function recalculatePositionVariables() {
  top.value = Math.max(scrollPosition.value - props.offset, 0);
  bottom.value = scrollPosition.value + containerHeight.value + props.bottomOffset;
}

let rafId: number | null = null;
function throttledUpdateVisibleItems() {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    updateVisibleItems();
    rafId = null;
  });
}

function onScroll(info: QScrollObserverDetails) {
  emit("scroll", info);
  scrollPosition.value = info.position.top;
  recalculatePositionVariables();

  throttledUpdateVisibleItems();

  if (props.infiniteLoadType === "bottom" && info.direction === "down") checkLoading();
}

function onResize() {
  containerHeight.value = window.innerHeight;
  recalculatePositionVariables();
  updateVisibleItems();
  checkLoading();
}

// -------------------------
// DYNAMIC HEIGHT HANDLING
// -------------------------
function onItemHeightChange(index: number, height: number) {
  if (height <= 0) return;
  const item = showedItems.value[index]!;
  const key = getItemKey(item);
  const oldHeight = heights.value[index] ?? props.minItemHeight;
  if (Math.abs(height - oldHeight) < 1) return;
  keyHeights[key] = height;
  heights.value[index] = height;
  generatedCumulativeHeights = generateCumulativeHeights();
  updateVisibleItems();
  if (index === showedItems.value.length - 1) checkLoading();
}

// -------------------------
// INFINITE LOADING
// -------------------------
function shouldLoadMore() {
  const contentHeight = scrollContent.value?.offsetHeight || 0;
  return (
    props.infiniteLoadType === "bottom" && (bottom.value >= contentHeight || contentHeight < containerHeight.value)
  );
}

function checkLoading() {
  if (isLoading.value || stopInfiniteLoad.value || !scrollContent.value) return;

  if (shouldLoadMore()) {
    isLoading.value = true;
    showLoading.value = true;
    emit("loadMore", props.items.length - 1, (stop?: boolean) => {
      isLoading.value = false;
      showLoading.value = false;
      if (stop) stopInfiniteLoad.value = true;
      void nextTick(() => {
        updateShowedItems();
      });
    });
  }
}

// -------------------------
// VISIBILITY OBSERVERS
// -------------------------
const isContentVisible = ref(true);

function checkVisibility(entries: IntersectionObserverEntry[]) {
  if (!entries.length) {
    isContentVisible.value = false;
  } else {
    const entry = entries[0]!;
    isContentVisible.value = entry.isIntersecting;
  }
  if (isContentVisible.value) {
    recalculatePositionVariables();
    updateVisibleItems();
    updateObservedElements(divs.value);
  }
}

// -------------------------
// OBSERVE ITEM RESIZES
// -------------------------
const divs = ref<Element[]>([]);
onBeforeUpdate(() => {
  divs.value = [];
});

const observedElements = new Set<Element>();
let resizeObserver: ResizeObserver | null = null;
function updateObservedElements(elements: Element[]) {
  if (!resizeObserver) return;

  const newEls = elements.filter((el) => el && getComputedStyle(el).display !== "none");

  for (const el of Array.from(observedElements)) {
    if (!newEls.includes(el)) {
      resizeObserver.unobserve(el);
      observedElements.delete(el);
    }
  }

  for (const el of newEls) {
    if (!observedElements.has(el)) {
      resizeObserver.observe(el);
      observedElements.add(el);
    }
  }
}

watch(
  divs,
  () => {
    void nextTick(() => updateObservedElements(divs.value));
  },
  { flush: "post" }
);

// -------------------------
// ON MOUNT / UNMOUNT
// -------------------------
let intersectionObserver: IntersectionObserver;

onMounted(() => {
  showedItems.value = props.items;
  updateShowedItems();
  updateVisibleItems();
  checkLoading();

  intersectionObserver = new IntersectionObserver(checkVisibility, {
    root: scrollContainer.value,
    threshold: 0.1
  });
  if (scrollContent.value) intersectionObserver.observe(scrollContent.value);

  if (!props.noResizeObserver)
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const indexAttr = entry.target.getAttribute("data-index");
        if (indexAttr !== null) {
          onItemHeightChange(Number(indexAttr), entry.contentRect.height);
        } else {
          checkLoading();
        }
      }
    });
  if (scrollContainer.value && resizeObserver) {
    resizeObserver.observe(scrollContainer.value);
  }
  updateObservedElements(divs.value);

  window.addEventListener("resize", onResize, { passive: true });

  void nextTick(() => {
    isContentVisible.value = scrollContent.value?.checkVisibility() ?? false;
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  if (intersectionObserver && scrollContent.value) {
    intersectionObserver.unobserve(scrollContent.value);
    intersectionObserver.disconnect();
  }

  if (resizeObserver) {
    observedElements.forEach((el) => resizeObserver?.unobserve(el));
    if (scrollContainer.value) resizeObserver.unobserve(scrollContainer.value);

    resizeObserver.disconnect();
    resizeObserver = null;

    observedElements.clear();
  }
});
</script>
