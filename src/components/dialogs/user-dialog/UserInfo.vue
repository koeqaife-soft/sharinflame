<template>
  <q-scroll-area class="scroll-area full-height fix-scroll-area" :visible="false">
    <div class="container">
      <template v-for="(section, index) in sections">
        <div v-if="section.visible" :key="index" :class="section.class" :style="animationDelay(index)">
          <div class="header">
            <q-icon :name="section.icon" :style="section.iconStyle" />
            <div>{{ $t(section.titleKey) }}</div>
          </div>
          <q-separator class="separator q-mb-xs q-mt-xs" />
          <template v-if="section.key === 'bio'">
            <div class="text" v-html="formatStringForHtml(props.user.bio!)" />
          </template>
          <template v-else-if="section.key === 'created_at'">
            <div class="text">{{ formatUnixTime(props.user.created_at, $t("locale")) }}</div>
          </template>
          <template v-else-if="section.key === 'languages'">
            <div class="text">
              <q-chip v-for="(language, langIndex) in props.user.languages" :key="langIndex">
                {{ language }}
              </q-chip>
            </div>
          </template>
        </div>
      </template>
    </div>
  </q-scroll-area>
</template>

<script setup lang="ts">
import { formatUnixTime, formatStringForHtml } from "src/utils/format";
import { computed } from "vue";

const props = defineProps<{
  user: User;
  meta: MetaData;
}>();

const sections = computed(() => [
  {
    key: "bio",
    class: "card bio animation-fade-in-down",
    icon: "sym_r_person",
    titleKey: "about_me",
    visible: !!props.user.bio,
    iconStyle: undefined
  },
  {
    key: "created_at",
    class: "card created-at animation-fade-in-down",
    icon: "sym_r_event",
    titleKey: "created_at",
    visible: true,
    iconStyle: { transform: "translateY(-1.55px)" }
  },
  {
    key: "languages",
    class: "card languages animation-fade-in-down",
    icon: "sym_r_language",
    titleKey: "languages",
    visible: !!props.user.languages?.length,
    iconStyle: undefined
  }
]);

function animationDelay(index: number): string {
  const visibleSections = sections.value.filter((section) => section.visible);
  const delay = Math.max(visibleSections.findIndex((_, i) => i === index) * 75, 0);
  return `--anim-delay: ${delay}ms`;
}
</script>
