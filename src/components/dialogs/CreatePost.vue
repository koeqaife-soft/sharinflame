<template>
  <q-dialog
    transition-show="slide-up"
    transition-hide="slide-down"
    class="create-post-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
  >
    <div class="dialog-content">
      <card-dialog-label class="q-mb-sm" icon="sym_r_article" :label="$t('create_post')">
        <q-btn flat round icon="sym_r_close" size="xs" @click="dialogRef!.hide()" />
      </card-dialog-label>
      <q-separator class="separator" />
      <q-scroll-area class="scroll-area fix-scroll-area" :visible="false">
        <q-input
          borderless
          v-model="text"
          autogrow
          maxlength="16384"
          :label="$t('add_your_text_here')"
          class="full-width post-text card q-my-sm"
          :disable="loading"
        />
        <q-separator class="separator q-mb-sm" />
        <toggle-value t_key="nsfw" icon="sym_r_explicit" v-model="is_nsfw" class="q-mb-sm" />
        <toggle-value t_key="ai" icon="sym_r_robot_2" v-model="ai_generated" class="q-mb-sm" />
      </q-scroll-area>
      <q-separator class="separator q-mb-sm" />
      <div class="send-container">
        <q-btn
          class="default-button"
          icon-right="sym_r_add"
          :label="$t('create')"
          no-caps
          @click="createPostButton"
          :disable="text.length == 0"
          :loading="loading"
        />
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from "quasar";
import { defineAsyncComponent, ref } from "vue";
import CardDialogLabel from "../misc/CardDialogLabel.vue";
import ToggleValue from "./create-post/ToggleValue.vue";
import { createPost } from "src/api/posts";
import { useProfileStore } from "src/stores/profile-store";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const PostDialog = defineAsyncComponent(() => import("./PostDialog.vue"));
const quasar = useQuasar();
const profileStore = useProfileStore();

const text = ref<string>("");
const is_nsfw = ref(false);
const ai_generated = ref(false);

const loading = ref(false);

function generateTags() {
  const tags = [];
  if (is_nsfw.value) tags.push("is-nsfw");
  if (ai_generated.value) tags.push("ai-generated");
  return tags.length > 0 ? tags : undefined;
}

async function createPostButton() {
  loading.value = true;
  const tags = generateTags();
  const r = await createPost({
    content: text.value!,
    tags: tags
  });
  loading.value = false;
  if (r.data.success && r.data.data) {
    const post = {
      ...r.data.data,
      user: await profileStore.getProfile()
    };
    quasar.dialog({
      component: PostDialog,
      componentProps: {
        post: post
      }
    });
    dialogRef!.value?.hide();
  }
}
</script>
