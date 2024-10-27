<template>
  <q-layout view="lHh Lpr lFf">
    <q-header unelevated>
      <q-toolbar class="toolbar">
        <svg viewBox="-2.4 -2.4 28.8 28.8" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon">
          <defs>
            <mask id="a">
              <rect x="-2.4" y="-2.4" width="28.8" height="28.8" rx="14.4" fill="#fff" />
              <path
                d="M12 21c4.418 0 8-3.356 8-7.496 0-3.741-2.035-6.666-3.438-8.06-.26-.258-.694-.144-.84.189-.748 1.69-2.304 4.123-4.293 4.123-1.232.165-3.112-.888-1.594-6.107.137-.47-.365-.848-.749-.534C6.905 4.905 4 8.511 4 13.504 4 17.644 7.582 21 12 21"
                fill="#000"
              />
            </mask>
          </defs>
          <rect x="-2.4" y="-2.4" width="28.8" height="28.8" rx="14.4" fill="currentColor" mask="url(#a)" />
        </svg>

        <q-toolbar-title> SharinFlame </q-toolbar-title>

        <q-btn flat dense round icon="sym_o_dark_mode" aria-label="DarkMode" @click="$q.dark.toggle()" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts"></script>
