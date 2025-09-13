<template>
  <q-page class="full-height">
    <div class="card info-card">
      <div class="label">It's beta!</div>
      <q-separator class="separator" />
      <div class="content">
        Hello user! <br /><br />
        Welcome to the second public beta test of SharinFlame! Don't judge all the features just yet — things are still
        in progress.
        <br /><br />
        Go ahead — <b>create posts, leave comments, and explore!</b> <br /><br />
        <b>Found a bug?</b> DM me on Discord (<b>@koeqaife</b>) <br /><br />
        Unlike the first beta test, this one will not be shut down, accounts won't be wiped and even will receive
        updates!
        <br /><br />
        You can come back next Saturday and see what I've added!!
        <br /><br />
        My plans include: “Forgot Password?”, account settings (username, email, password, etc.), reputation, DMs, and
        more.
        <br /><br />
        <b>Have fun!</b> ♥
      </div>
      <div class="action-container">
        <my-button type="primary" label="Proceed" icon="check" @click="proceed" />
      </div>
    </div>
  </q-page>
</template>
<script setup lang="ts">
import { useMainStore } from "src/stores/main-store";
import { useRouter } from "vue-router";
import MyButton from "src/components/my/MyButton.vue";

const mainStore = useMainStore();
const router = useRouter();

function proceed() {
  localStorage.setItem("first_start", "no");
  mainStore.initialized = 0;
  void router.push({ path: "/" });
}
</script>
<style lang="css" scoped>
.q-page {
  display: flex;
  justify-content: center;
  align-content: center;
}
.info-card {
  align-self: center;
  justify-self: center;
  width: 100%;
  max-width: 600px;
  padding: 16px;
}
.label {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  width: 100%;
}
.content {
  font-size: 15px;
}
.action-container {
  display: flex;
  width: 100%;
  justify-content: flex-end;
}
</style>
