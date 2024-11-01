<template>
  <q-page class="flex flex-center">
    <post-scroll :type="currentType" />
  </q-page>
</template>

<script setup lang="ts">
import { KeyOfGetPostsTypes } from "src/api/posts";
import PostScroll from "src/components/PostScroll.vue";
import { ref } from "vue";

const currentType = ref<KeyOfGetPostsTypes>("popular");
</script>
