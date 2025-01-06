<template>
  <div class="virtual-scroll" ref="scrollContainer">
    <q-scroll-observer @scroll="onScroll" :debounce="debounce" />
    <div class="virtual-filler-top" :style="{ height: `${topFillerHeight}px` }" />
    <template v-for="(item, index) in items" :key="getItemKey(item)">
      <div class="virtual-item" v-if="!hasHeight(index) || (index >= visibleIndexes[0] && index <= visibleIndexes[1])">
        <q-resize-observer @resize="(event) => onItemHeightChange(index, event)" />
        <slot :item="item" :index="index" />
      </div>
    </template>
    <div class="virtual-filler-bottom" :style="{ height: `${bottomFillerHeight}px` }" />
  </div>
</template>

<script setup lang="ts" generic="T">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";

interface Props {
  items: T[];
  margins?: number;
  offset?: number;
  bottomOffset?: number;
  debounce?: number;
  itemKey: keyof T;
}

const props = withDefaults(defineProps<Props>(), {
  margins: 0,
  offset: 250,
  bottomOffset: 500,
  debounce: 150
});

const itemsRef = ref(props.items);

watch(
  itemsRef,
  () => {
    itemsRef.value = props.items;
    updateVisibleItems();
  },
  { deep: true }
);

const heights = ref<number[]>([]);
const containerHeight = ref(0);

const scrollContainer = ref<HTMLElement | null>(null);

const top = ref(0);
const bottom = computed(() => top.value + containerHeight.value + props.offset + props.bottomOffset);

const topFillerHeight = ref(0);
const bottomFillerHeight = ref(0);

const visibleIndexes = ref<number[]>([]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getItemKey = (item: any) => {
  return item[props.itemKey];
};

function updateVisibleItems() {
  let cumulativeHeight = 0;
  let topIndex = -1;
  let bottomIndex = -1;

  for (let i = 0; i < heights.value.length; i++) {
    const itemHeight = heights.value[i] || 0;
    const nextCumulativeHeight = cumulativeHeight + itemHeight;

    if (topIndex === -1 && top.value < nextCumulativeHeight) {
      topIndex = i;
    }

    if (bottom.value <= nextCumulativeHeight) {
      bottomIndex = i;
      break;
    }

    cumulativeHeight = nextCumulativeHeight;
  }

  if (bottomIndex === -1) {
    bottomIndex = heights.value.length - 1;
  }

  visibleIndexes.value = [topIndex, bottomIndex];

  topFillerHeight.value = heights.value.slice(0, topIndex).reduce((acc, height) => acc + (height || 0), 0);
  bottomFillerHeight.value = heights.value.slice(bottomIndex + 1).reduce((acc, height) => acc + (height || 0), 0);
}

function onScroll(info: QScrollObserverDetails) {
  top.value = Math.max(info.position.top - props.offset, 0);
  updateVisibleItems();
}

function onResize() {
  containerHeight.value = window.innerHeight;
  updateVisibleItems();
}

function onItemHeightChange(index: number, info: { height: number; width: number }) {
  heights.value[index] = info.height + (props.margins || 0);
  updateVisibleItems();
}

function hasHeight(index: number) {
  return !!heights.value[index];
}

onMounted(() => {
  nextTick(() => {
    if (scrollContainer.value) {
      containerHeight.value = window.innerHeight;
    }
    updateVisibleItems();
  });
});

onMounted(() => {
  window.addEventListener("resize", onResize);

  onResize();
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
});
</script>
