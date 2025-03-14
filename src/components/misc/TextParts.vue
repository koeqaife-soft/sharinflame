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
import { splitHtmlCache, effectiveLinesCache, simpleHash256 } from "src/utils/cache";

interface Props {
  text: string;
  html?: boolean;
  defaultSize?: number;
  defaultLines?: number;
  lineCharacters?: number;
}

const props = withDefaults(defineProps<Props>(), {
  html: false,
  defaultSize: 1450,
  defaultLines: 25,
  lineCharacters: 58
});

const TOKEN_REGEX = /(<[^>]+>|[^<]+)/g;
const SELF_CLOSING_REGEX = /\/>$/;
const BR_TAG_REGEX = /^<br\s*\/?>/i;
const HR_TAG_REGEX = /^<hr\s*\/?>/i;
const CLOSING_TAG_REGEX = /^<\/(\w+)>/;
const OPENING_TAG_REGEX = /^<(\w+)/;
const NEWLINE_REGEX = /\n/g;
const BR_HR_REGEX = /<br\s*\/?>|<hr\s*\/?>/gi;
const TAG_REGEX = /<[^>]*>/g;

function splitHtml(html: string, maxCount: number, maxLines: number): string[] {
  const hash = simpleHash256(html + maxCount + maxLines);
  if (splitHtmlCache.has(hash)) return splitHtmlCache.get(hash)!;

  const tokens = html.match(TOKEN_REGEX) || [];
  const parts: string[] = [];
  let currentPart = "";
  let charCount = 0;
  let lineCount = 0;
  let lineCharCount = 0;
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
      if (BR_TAG_REGEX.test(token) || HR_TAG_REGEX.test(token)) {
        lineCount++;
        lineCharCount = 0;
        if (lineCount >= maxLines) {
          parts.push(currentPart + getClosingTags());
          currentPart = getOpeningTags();
          charCount = 0;
          lineCount = 0;
          lineCharCount = 0;
        }
      }
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
        const availableOverall = maxCount - charCount;
        const availableImplicit = props.lineCharacters - lineCharCount;
        const takeLength = Math.min(availableOverall, availableImplicit, remainingText.length);
        const take = remainingText.slice(0, takeLength);
        currentPart += take;
        charCount += takeLength;
        lineCharCount += takeLength;
        remainingText = remainingText.slice(takeLength);

        if (lineCharCount >= props.lineCharacters) {
          lineCount++;
          lineCharCount = 0;
          if (lineCount >= maxLines) {
            parts.push(currentPart + getClosingTags());
            currentPart = getOpeningTags();
            charCount = 0;
            lineCount = 0;
            lineCharCount = 0;
          }
        }
        if (charCount === maxCount) {
          parts.push(currentPart + getClosingTags());
          currentPart = getOpeningTags();
          charCount = 0;
          lineCharCount = 0;
          lineCount = 0;
        }
      }
    }
  }

  if (currentPart) {
    parts.push(currentPart + getClosingTags());
  }

  splitHtmlCache.put(hash, parts);

  return parts;
}

function splitPlainText(text: string, maxCount: number, maxLines: number): string[] {
  const parts: string[] = [];
  let currentPart = "";
  let charCount = 0;
  let lineCount = 0;
  let lineCharCount = 0;
  let i = 0;
  while (i < text.length) {
    const availableOverall = maxCount - charCount;
    const availableImplicit = props.lineCharacters - lineCharCount;
    const newlineIndex = text.indexOf("\n", i);
    const availableToNewline = newlineIndex !== -1 ? newlineIndex - i + 1 : Infinity;
    const takeLength = Math.min(availableOverall, availableImplicit, availableToNewline, text.length - i);
    currentPart += text.slice(i, i + takeLength);
    charCount += takeLength;
    lineCharCount += takeLength;
    i += takeLength;

    if (newlineIndex !== -1 && newlineIndex < i) {
      lineCount++;
      lineCharCount = 0;
    }
    if (lineCharCount >= props.lineCharacters) {
      lineCount++;
      lineCharCount = 0;
    }
    if (charCount === maxCount || lineCount === maxLines) {
      parts.push(currentPart);
      currentPart = "";
      charCount = 0;
      lineCount = 0;
      lineCharCount = 0;
    }
  }
  if (currentPart) {
    parts.push(currentPart);
  }
  return parts;
}

const parts = computed(() => {
  if (!props.text) return [];
  const effectiveLinesKey = simpleHash256(
    props.text + props.html + props.defaultSize + props.defaultLines + props.lineCharacters
  );
  let effectiveLines: number;
  if (effectiveLinesCache.has(effectiveLinesKey)) {
    effectiveLines = effectiveLinesCache.get(effectiveLinesKey)!;
  } else if (props.html) {
    const explicitLines = (props.text.match(BR_HR_REGEX) || []).length;
    const stripped = props.text.replace(TAG_REGEX, "");
    const implicitLines = Math.floor(stripped.length / props.lineCharacters);
    effectiveLines = explicitLines + implicitLines;
  } else {
    const explicitLines = (props.text.match(NEWLINE_REGEX) || []).length;
    const implicitLines = Math.floor(props.text.length / props.lineCharacters);
    effectiveLines = explicitLines + implicitLines;
  }

  effectiveLinesCache.put(effectiveLinesKey, effectiveLines);

  if (props.text.length < props.defaultSize && effectiveLines < props.defaultLines) {
    return [props.text];
  }
  return props.html
    ? splitHtml(props.text, props.defaultSize, props.defaultLines)
    : splitPlainText(props.text, props.defaultSize, props.defaultLines);
});

const showedIndex = ref(0);

function more() {
  showedIndex.value++;
}
</script>
