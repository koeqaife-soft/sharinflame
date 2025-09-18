<template>
  <q-dialog
    transition-show="scale"
    transition-hide="scale"
    class="mod-delete-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
  >
    <div class="dialog-content">
      <div class="title">{{ $t(`mod_delete_dialog.title`) }}</div>
      <q-input
        borderless
        v-model="text"
        autogrow
        maxlength="512"
        :label="$t('reason')"
        class="full-width textarea card"
        :disable="loading"
      />
      <div class="buttons horizontal-container">
        <my-button :label="$t('cancel')" type="flat" icon="close" @click="dialogRef!.hide()" :disable="loading" />
        <my-button :label="$t('delete')" type="primary" icon="report" @click="onOk" :loading="loading" />
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from "quasar";
import MyButton from "../my/MyButton.vue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { deleteComment, deletePost } from "src/api/posts";

const emit = defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const props = defineProps<
  | {
      targetType: "post";
      postId: string;
    }
  | {
      targetType: "comment";
      postId: string;
      commentId: string;
    }
>();

const quasar = useQuasar();
const { t } = useI18n();
const text = ref("");
const loading = ref(false);

async function onOk() {
  loading.value = true;
  try {
    if (props.targetType == "post") {
      await deletePost(props.postId, undefined, text.value);
    } else if (props.targetType == "comment") {
      await deleteComment(props.postId, props.commentId, undefined, text.value);
    } else {
      throw new Error("Unknown targetType");
    }

    quasar.notify({
      type: "default-notification",
      message: t("mod_delete_dialog.title"),
      caption: t("mod_delete_dialog.success"),
      progress: true,
      icon: "sym_r_done_outline"
    });

    dialogRef.value?.hide();
    emit("ok");
  } catch {
    quasar.notify({
      type: "error-notification",
      message: t("mod_delete_dialog.failed"),
      progress: true
    });
  } finally {
    loading.value = false;
  }
}
</script>
