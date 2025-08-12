<template>
  <i class="material-symbols-rounded my-icon" hidden="true" role="img">
    {{ icon }}
  </i>
</template>
<script setup lang="ts">
defineProps<{
  icon: string;
}>();
</script>
