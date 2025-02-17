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
  defaultPart?: number;
}

const props = withDefaults(defineProps<Props>(), {
  html: false,
  defaultPart: 1750
});

function splitHtml(html: string, maxCount: number): string[] {
  const tokens = html.match(/(<[^>]+>|[^<]+)/g) || [];
  const parts: string[] = [];
  let currentPart = "";
  let charCount = 0;

  const openTagsStack: string[] = [];

  const closeOpenTags = () =>
    openTagsStack
      .slice()
      .reverse()
      .map((tag) => `</${tag}>`)
      .join("");
  const openTags = () => openTagsStack.map((tag) => `<${tag}>`).join("");

  for (const token of tokens) {
    if (token.startsWith("<")) {
      currentPart += token;
      const isSelfClosing = /\/>$/.test(token) || /^<br\s*\/?>/i.test(token) || /^<hr\s*\/?>/i.test(token);
      if (!isSelfClosing) {
        if (/^<\/\w+>/.test(token)) {
          const tagMatch = token.match(/^<\/(\w+)>/);
          if (tagMatch) {
            const tagName = tagMatch[1];
            const index = openTagsStack.lastIndexOf(tagName!);
            if (index !== -1) {
              openTagsStack.splice(index, 1);
            }
          }
        } else {
          const tagMatch = token.match(/^<(\w+)/);
          if (tagMatch) {
            openTagsStack.push(tagMatch[1]!);
          }
        }
      }
    } else {
      let remainingText = token;
      while (remainingText.length > 0) {
        const remainingChars = maxCount - charCount;
        if (remainingText.length <= remainingChars) {
          currentPart += remainingText;
          charCount += remainingText.length;
          remainingText = "";
        } else {
          currentPart += remainingText.slice(0, remainingChars);
          parts.push(currentPart + closeOpenTags());
          currentPart = openTags();
          remainingText = remainingText.slice(remainingChars);
          charCount = 0;
        }
        if (charCount === maxCount) {
          parts.push(currentPart + closeOpenTags());
          currentPart = openTags();
          charCount = 0;
        }
      }
    }
  }
  if (currentPart) {
    parts.push(currentPart + closeOpenTags());
  }
  return parts;
}

const parts = computed(() => {
  if (!props.text) return [];
  if (props.text.length < props.defaultPart) return [props.text];

  if (props.html) {
    return splitHtml(props.text, props.defaultPart);
  } else {
    const result: string[] = [];
    for (let i = 0; i < props.text.length; i += props.defaultPart) {
      result.push(props.text.slice(i, i + props.defaultPart));
    }
    return result;
  }
});

const showedIndex = ref(0);

function more() {
  showedIndex.value++;
}
</script>
