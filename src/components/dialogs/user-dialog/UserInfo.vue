<template>
  <q-scroll-area class="scroll-area full-height fix-scroll-area" :visible="false">
    <div class="container">
      <div class="card bio animation-fade-in-down" v-if="user.bio">
        <div class="header">
          <q-icon name="sym_r_person" />
          <div>{{ $t("about_me") }}</div>
        </div>
        <q-separator class="separator q-mb-xs q-mt-xs" />
        <div class="text" v-html="formatStringForHtml(user.bio)" />
      </div>
      <div class="card created-at animation-fade-in-down" style="--anim-delay: 75ms">
        <div class="header">
          <q-icon name="sym_r_event" style="transform: translateY(-1.55px)" />
          <div>{{ $t("created_at") }}</div>
        </div>
        <q-separator class="separator q-mb-xs q-mt-xs" />
        <div class="text">{{ formatUnixTime(user.created_at, $t("locale")) }}</div>
      </div>
      <div class="card languages animation-fade-in-down" style="--anim-delay: 150ms" v-if="user.languages">
        <div class="header">
          <q-icon name="sym_r_language" />
          <div>{{ $t("languages") }}</div>
        </div>
        <q-separator class="separator q-mb-xs q-mt-xs" />
        <q-chip v-for="(item, index) in user.languages" :key="index">
          {{ item }}
        </q-chip>
      </div>
    </div>
  </q-scroll-area>
</template>
<script setup lang="ts">
import { formatStringForHtml, formatUnixTime } from "src/utils/format";
defineProps<{
  user: User;
  meta: MetaData;
}>();
</script>
