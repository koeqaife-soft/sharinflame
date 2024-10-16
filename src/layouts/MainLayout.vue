<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="toolbar no-shadow">
        <q-toolbar-title> SharinFlame </q-toolbar-title>

        <q-btn flat dense round icon="dark_mode" aria-label="DarkMode" @click="$q.dark.toggle()" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts"></script>
