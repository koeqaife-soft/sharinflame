<template>
  <div class="virtual-scroll" ref="scrollContainer">
    <q-scroll-observer @scroll="onScroll" :debounce="debounce" />
    <div class="virtual-scroll-content" ref="scrollContent">
      <div class="virtual-filler-top" :style="{ height: `${fillersHeight[0]}px`, width: '0px' }" />
      <template v-for="(item, index) in showedItems" :key="getItemKey(item)">
        <div
          class="virtual-item"
          v-if="index >= visibleIndexes[0]! && index <= visibleIndexes[1]!"
          :data-index="index"
          :ref="
            (el) => {
              if (el) divs[index] = el;
            }
          "
        >
          <slot :item="item" :index="index" />
        </div>
      </template>
      <div class="virtual-filler-bottom" :style="{ height: `${fillersHeight[1]}px`, width: '0px' }" />
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
import {
  ComponentPublicInstance,
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  Ref,
  ref,
  watch,
  onBeforeUpdate
} from "vue";

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
}

const props = withDefaults(defineProps<Props>(), {
  margins: 0,
  offset: 250,
  bottomOffset: 250,
  debounce: 50,
  minItemHeight: 125,
  infiniteLoadType: "none"
});

const emit = defineEmits<{
  (e: "loadMore", index: number, done: (stop?: boolean) => void): void;
  (e: "scroll", info: QScrollObserverDetails): void;
}>();

defineExpose({ updateShowedItems });

const heights: Ref<(number | undefined)[]> = ref([]);

type KeyType = string | number | symbol;
const keyHeights: Record<KeyType, number> = {};

let containerHeight = 0;

const itemHeightMargins = computed(() => props.minItemHeight + props.margins);

const scrollContent = ref<HTMLElement | null>(null);
const scrollContainer = ref<HTMLElement | null>(null);
const loadingRef = ref<HTMLElement | null>(null);

let scrollPosition = 0;

const top = ref(0);
const bottom = ref(0);

const fillersHeight = ref([0, 0]);

const fastScrollDelta = computed(() => 900 * (Math.log2(props.debounce + 1) / Math.log2(150 + 1)));

const visibleIndexes = ref(new Uint32Array([0, 0]));

const showedItems: Ref<T[]> = ref([]);
let showedItemsTickLock = false;

const isLoading = ref(false);
const stopInfiniteLoad = ref(false);

const isContentVisible = ref(false);

let isLoadingTimeout: NodeJS.Timeout | undefined = undefined;
const showLoading = ref(false);

const showLoadingSlot = computed(() => isLoading.value && showLoading.value);

const divs = ref<(Element | ComponentPublicInstance)[]>([]);
const observedElements = new Set<Element>();
let resizeObserver: ResizeObserver | null = null;

onBeforeUpdate(() => {
  divs.value = [];
});

watch(
  divs,
  () => {
    nextTick(() => updateObservedElements(divs.value));
  },
  { flush: "post" }
);

function updateObservedElements(elements: (Element | ComponentPublicInstance)[]) {
  if (!resizeObserver) return;

  if (isContentVisible.value) {
    const newElements = elements
      .map((el) => (el instanceof Element ? el : (el.$el as Element)))
      .filter((el): el is Element => el instanceof Element && getComputedStyle(el).display !== "none");

    const toAdd = newElements.filter((el) => !observedElements.has(el));
    const toRemove = Array.from(observedElements).filter((el) => !newElements.includes(el));

    toRemove.forEach((el) => {
      resizeObserver!.unobserve(el);
      observedElements.delete(el);
    });

    toAdd.forEach((el) => {
      resizeObserver!.observe(el);
      observedElements.add(el);
    });
  } else {
    observedElements.forEach((el) => resizeObserver?.unobserve(el));
    observedElements.clear();
  }
}

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

function updateShowedItems(addedOnTop?: number) {
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

      heights.value.length = 0;
      heights.value.push(...newHeights);
      generatedCumulativeHeights = generateCumulativeHeights();

      showedItems.value = { ...props.items };

      if (addedOnTop && addedOnTop > 0) {
        visibleIndexes.value[1] = (visibleIndexes.value[1] || 0) + addedOnTop;
      }
    } finally {
      showedItemsTickLock = false;
      showLoading.value = false;
    }
  });
}

function shouldLoadMore() {
  return (
    (heights.value.at(-1) !== undefined || heights.value.length == 0) &&
    props.infiniteLoadType === "bottom" &&
    bottom.value >= (scrollContent.value?.offsetHeight || 0)
  );
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

  if (shouldLoadMore()) {
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

function generateCumulativeHeights(afterIndex = 0) {
  if (afterIndex > 0 && generatedCumulativeHeights.length > 0) {
    let cumulativeHeight = generatedCumulativeHeights[afterIndex - 1]!;

    for (let i = afterIndex; i < heights.value.length; i++) {
      const itemHeight = heights.value[i] ?? itemHeightMargins.value;
      cumulativeHeight += itemHeight + props.margins;
      generatedCumulativeHeights[i] = cumulativeHeight;
    }
  } else {
    let cumulativeHeight = 0;
    generatedCumulativeHeights = [];

    for (let i = 0; i < heights.value.length; i++) {
      const itemHeight = heights.value[i] ?? itemHeightMargins.value;
      cumulativeHeight += itemHeight + props.margins;
      generatedCumulativeHeights.push(cumulativeHeight);
    }
  }

  return generatedCumulativeHeights;
}

function calculateVisibleIndexes(h: number[], endIndex?: number, startIndex?: number) {
  let topIndex = -1;
  let bottomIndex = -1;

  const end = (endIndex && endIndex + 1) ?? h.length;
  const start = startIndex ?? 0;
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

  visibleIndexes.value[0] = Math.max(topIndex - 5, 0);
  visibleIndexes.value[1] = Math.min(bottomIndex + 2, h.length - 1);
}

function updateVisibleItems(fullUpdate = true, noDebounce = false) {
  const func = () =>
    nextTick(() => {
      if (updateLock || !isContentVisible.value) return;
      if (noDebounce && props.virtualDebounce) updateLock = true;
      const lastTopIndex = visibleIndexes.value[0];
      const lastBottomIndex = visibleIndexes.value[1];

      if (fullUpdate || lastTopIndex === undefined || lastBottomIndex === undefined || !generatedCumulativeHeights) {
        generatedCumulativeHeights = generateCumulativeHeights();
        calculateVisibleIndexes(generatedCumulativeHeights);
      } else {
        if (top.value < lastPosition) calculateVisibleIndexes(generatedCumulativeHeights, lastBottomIndex, undefined);
        else calculateVisibleIndexes(generatedCumulativeHeights, undefined, lastTopIndex);
      }

      const topIndex = visibleIndexes.value[0]!;
      const bottomIndex = visibleIndexes.value[1]!;

      if (lastTopIndex != topIndex) fillersHeight.value[0] = generatedCumulativeHeights[topIndex - 1] ?? 0;

      if (lastBottomIndex != bottomIndex)
        fillersHeight.value[1] =
          (generatedCumulativeHeights[heights.value.length - 1] ?? 0) - (generatedCumulativeHeights[bottomIndex] ?? 0);

      updateLock = false;
      lastPosition = top.value;
    });
  if (!noDebounce && props.virtualDebounce) {
    if (updateVisibleDebounce) clearTimeout(updateVisibleDebounce);
    updateVisibleDebounce = setTimeout(func, props.virtualDebounce);
  } else func();
}

let updateDebounce: NodeJS.Timeout | null = null;

function onScroll(info: QScrollObserverDetails) {
  if (!isContentVisible.value) return;
  emit("scroll", info);
  scrollPosition = info.position.top;
  recalculatePositionVariables();

  requestAnimationFrame(() => {
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
  });
}

function onResize() {
  if (!isContentVisible.value) return;
  containerHeight = window.innerHeight;
  recalculatePositionVariables();
  if (!updateDebounce) {
    updateVisibleItems(false);
    checkLoading();
  }
}

function onItemHeightChange(index: number, height: number) {
  if (!isContentVisible.value) return;
  if (height === 0) return;

  const item = showedItems.value[index]!;
  keyHeights[getItemKey(item) as KeyType] = height;
  if (heights.value[index] !== height) {
    heights.value[index] = height;
    generatedCumulativeHeights = generateCumulativeHeights(index);
    updateVisibleItems(false);
    if (index == showedItems.value.length - 1) checkLoading();
  }
}

let intersectionObserver: IntersectionObserver;

const isVisible = (entry: IntersectionObserverEntry) => {
  const rect = entry.boundingClientRect;
  const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
  return entry.isIntersecting && isInViewport;
};

const checkVisibility = (entry: IntersectionObserverEntry[]) => {
  let lastValue = isContentVisible.value;
  if (scrollContainer.value?.checkVisibility) {
    isContentVisible.value = scrollContainer.value?.checkVisibility() || false;
  } else if (entry.length === 0) {
    isContentVisible.value = false;
  } else {
    isContentVisible.value = isVisible(entry[0]!) || false;
  }
  if (lastValue != isContentVisible.value) {
    recalculatePositionVariables();
    updateVisibleItems(true, true);
    nextTick(() => updateObservedElements(divs.value));
  }
};

function recalculatePositionVariables() {
  top.value = Math.max(scrollPosition - props.offset, 0);
  bottom.value = scrollPosition + containerHeight + props.bottomOffset;
}

let resizeFrame: number;

onMounted(() => {
  nextTick(() => {
    containerHeight = window.innerHeight;
    updateVisibleItems();
    checkLoading();

    if (!intersectionObserver) {
      intersectionObserver = new IntersectionObserver(checkVisibility, {
        root: scrollContainer.value,
        threshold: 0.1
      });
      intersectionObserver.observe(scrollContent.value!);
    }

    if (!resizeObserver) {
      resizeObserver = new ResizeObserver((entries) => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          for (const entry of entries) {
            const index = entry.target.getAttribute("data-index");
            if (index !== null) {
              onItemHeightChange(Number(index), entry.contentRect.height);
            } else {
              checkLoading();
            }
          }
        });
      });
      resizeObserver.observe(scrollContainer.value!);
      updateObservedElements(divs.value);
    }
  });
});

onMounted(() => {
  window.addEventListener("resize", onResize, { passive: true });
  onResize();

  showedItems.value = { ...props.items };
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  if (intersectionObserver) {
    intersectionObserver.unobserve(scrollContent.value!);
    intersectionObserver.disconnect();
  }
  if (resizeObserver) {
    observedElements.forEach((el) => resizeObserver?.unobserve(el));
    resizeObserver?.unobserve(scrollContainer.value!);
    resizeObserver?.disconnect();
    resizeObserver = null;
    observedElements.clear();
  }
  if (isLoadingTimeout) clearTimeout(isLoadingTimeout);
  if (updateDebounce) clearTimeout(updateDebounce);
  if (updateVisibleDebounce) clearTimeout(updateVisibleDebounce);
  if (resizeFrame) cancelAnimationFrame(resizeFrame);

  keyHeights.length = 0;
});
</script>
