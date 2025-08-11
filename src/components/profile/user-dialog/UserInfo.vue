<template>
  <q-scroll-area class="scroll-area full-height fix-scroll-area" :visible="false">
    <div class="container">
      <template v-for="(section, index) in sections">
        <div v-if="section.visible" :key="index" :class="section.class" :style="animationDelay(section.key)">
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
            <div class="languages-container">
              <q-chip v-for="(language, langIndex) in props.user.languages" :key="langIndex">
                {{ language }}
              </q-chip>
            </div>
          </template>
          <template v-else-if="section.key === 'badges'">
            <div class="container badges">
              <div
                class="badge horizontal-container animation-fade-in-down"
                v-for="(badge, badgeIndex) in props.user.badges"
                :style="animationDelayComponent(badgeIndex)"
                :key="badgeIndex"
              >
                <q-icon :name="badgeIcons[badge as BadgesKeys]" class="icon" />
                <div class="text-container">
                  <div class="label">{{ $t(getLabelKey(badge)) }}</div>
                  <div class="description">{{ $t(getDescriptionKey(badge)) }}</div>
                </div>
              </div>
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
    key: "badges",
    class: "card badges animation-fade-in-down",
    icon: "sym_r_award_star",
    titleKey: "badges_title",
    visible: !!props.user.badges?.length,
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

const badgesKeys = {
  0: "owner",
  1: "tester",
  2: "first"
} as const;

const badgeIcons = {
  0: "sym_r_crown",
  1: "sym_r_experiment",
  2: "sym_r_trophy"
} as const;

type BadgesKeys = keyof typeof badgesKeys;

function getLabelKey(badge: number): string {
  return `badges.${badgesKeys[badge as BadgesKeys]}.label`;
}

function getDescriptionKey(badge: number): string {
  return `badges.${badgesKeys[badge as BadgesKeys]}.description`;
}

function animationDelay(key: string): string {
  const visibleSections = sections.value.filter((section) => section.visible);
  const delay = Math.max(visibleSections.findIndex((section) => section.key === key) * 75, 0);

  return `--anim-delay: ${delay}ms`;
}

function animationDelayComponent(index: number): string {
  const delay = Math.max(index * 75, 0);
  return `--anim-delay: ${delay}ms`;
}
</script>
