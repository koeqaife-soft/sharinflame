<template>
  <q-layout view="lHh Lpr lFf">
    <q-header unelevated>
      <q-toolbar class="toolbar">
        <LogoComponent />

        <q-toolbar-title> SharinFlame </q-toolbar-title>

        <q-btn flat dense round icon="sym_o_dark_mode" aria-label="DarkMode" @click="$q.dark.toggle()" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import LogoComponent from "src/components/LogoComponent.vue";
</script>
