<template>
  <span>
    <template v-for="(fragment, index) in parts" :key="index">
      <span v-if="props.html" v-html="fragment" v-show="index <= showedIndex"></span>
      <span v-else v-show="index <= showedIndex">{{ fragment }}</span>
    </template>
    <template v-if="showedIndex < parts.length - 1">
      <span>...</span>
      <button class="more-btn" @click="more">{{ $t("more") }}</button>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

interface Props {
  text: string;
  html?: boolean;
  defaultSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  html: false,
  defaultSize: 1750
});

const TOKEN_REGEX = /(<[^>]+>|[^<]+)/g;
const SELF_CLOSING_REGEX = /\/>$/;
const BR_TAG_REGEX = /^<br\s*\/?>/i;
const HR_TAG_REGEX = /^<hr\s*\/?>/i;
const CLOSING_TAG_REGEX = /^<\/(\w+)>/;
const OPENING_TAG_REGEX = /^<(\w+)/;

function splitHtml(html: string, maxCount: number): string[] {
  const tokens = html.match(TOKEN_REGEX) || [];
  const parts: string[] = [];
  let currentPart = "";
  let charCount = 0;
  const openTagsStack: string[] = [];

  const getClosingTags = () =>
    openTagsStack
      .slice()
      .reverse()
      .map((tag) => `</${tag}>`)
      .join("");

  const getOpeningTags = () => openTagsStack.map((tag) => `<${tag}>`).join("");

  for (const token of tokens) {
    if (token.startsWith("<")) {
      currentPart += token;

      const isSelfClosing = SELF_CLOSING_REGEX.test(token) || BR_TAG_REGEX.test(token) || HR_TAG_REGEX.test(token);

      if (!isSelfClosing) {
        if (CLOSING_TAG_REGEX.test(token)) {
          const tagMatch = token.match(CLOSING_TAG_REGEX);
          if (tagMatch) {
            const tagName = tagMatch[1]!;
            const index = openTagsStack.lastIndexOf(tagName);
            if (index !== -1) {
              openTagsStack.splice(index, 1);
            }
          }
        } else if (OPENING_TAG_REGEX.test(token)) {
          const tagMatch = token.match(OPENING_TAG_REGEX);
          if (tagMatch) {
            openTagsStack.push(tagMatch[1]!);
          }
        }
      }
    } else {
      let remainingText = token;
      while (remainingText.length > 0) {
        const available = maxCount - charCount;
        const take = remainingText.slice(0, available);
        currentPart += take;
        charCount += take.length;
        remainingText = remainingText.slice(take.length);

        if (charCount === maxCount) {
          parts.push(currentPart + getClosingTags());
          currentPart = getOpeningTags();
          charCount = 0;
        }
      }
    }
  }

  if (currentPart) {
    parts.push(currentPart + getClosingTags());
  }

  return parts;
}

const parts = computed(() => {
  if (!props.text) return [];
  if (props.text.length < props.defaultSize) return [props.text];

  return props.html
    ? splitHtml(props.text, props.defaultSize)
    : Array.from({ length: Math.ceil(props.text.length / props.defaultSize) }, (_, i) =>
        props.text.slice(i * props.defaultSize, (i + 1) * props.defaultSize)
      );
});

const showedIndex = ref(0);

function more() {
  showedIndex.value++;
}
</script>
