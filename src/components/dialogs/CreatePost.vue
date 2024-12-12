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
        />
        <q-separator class="separator q-mb-sm" />
        <toggle-value t_key="nsfw" icon="sym_r_explicit" v-model="is_nsfw" class="q-mb-sm" />
        <toggle-value t_key="ai" icon="sym_r_robot_2" v-model="ai_generated" class="q-mb-sm" />
      </q-scroll-area>
      <q-separator class="separator q-mb-sm" />
      <div class="send-container">
        <q-btn class="default-button" icon-right="sym_r_add" :label="$t('create')" no-caps />
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import { useDialogPluginComponent } from "quasar";
import { ref, watch } from "vue";
import CardDialogLabel from "../misc/CardDialogLabel.vue";
import ToggleValue from "./create-post/ToggleValue.vue";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const text = ref<string>();
const is_nsfw = ref(false);
const ai_generated = ref(false);
watch(is_nsfw, () => {
  console.log(is_nsfw.value);
});
</script>
