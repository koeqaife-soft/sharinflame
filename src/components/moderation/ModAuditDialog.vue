<template>
  <q-dialog
    transition-show="slide-up"
    transition-hide="slide-down"
    class="mod-audit-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    :key="props.audit.id"
  >
    <closeable-content v-on:hide="dialogRef!.hide()">
      <div class="dialog-header" style="z-index: 2">
        <div class="horizontal-container label-container">
          <my-icon icon="shield" class="header-icon" />
          <div class="label">{{ $t("blocked_resource") }}</div>
          <q-space />
          <my-button icon="close" @click="dialogRef!.hide()" />
        </div>
      </div>

      <div class="dialog-content-inner">
        <q-scroll-area class="scroll-area fix-scroll-area" :visible="false">
          <div class="card section q-mb-sm">
            <my-icon :icon="icons[content._type]" />
            <div class="note">{{ $t(content._type) }}</div>
          </div>

          <div :key="user.created_at">
            <post-component v-if="content._type == 'post'" :post="content" disable-actions />
            <comment-component v-else-if="content._type == 'comment'" :comment="content" disable-actions />
          </div>

          <div class="card time section q-mt-sm">
            <my-icon icon="event" />
            <div class="note">{{ $t("moderated_on") }}:</div>
            <div class="info-label">{{ formatUnixTime(audit.created_at, $t("locale")) }}</div>
          </div>

          <div class="card moderated-by section q-mt-sm">
            <my-icon icon="shield_person" />
            <div class="note">{{ $t("moderated_by") }}</div>
            <open-user-dialog :user="audit.user" class="moderator-avatar" />
            <div class="moderator-name info-label">{{ audit.user.display_name || audit.user.username }}</div>
          </div>

          <div class="card reason section q-mt-sm">
            <my-icon icon="problem" />
            <div class="note">{{ $t("reason") }}:</div>
            <div class="reason-label info-label">{{ audit.reason }}</div>
          </div>

          <div class="card appellation section q-mt-sm">
            <my-icon icon="person_shield" />
            <div class="note">{{ $t("appellation_status.label") }}:</div>
            <my-icon
              :icon="
                {
                  pending: 'pending',
                  approved: 'check',
                  rejected: 'block'
                }[audit.appellation_status]
              "
              v-if="audit.appellation_status !== 'none'"
              class="appellation-icon"
            />
            <div class="appellation-label info-label">{{ $t(`appellation_status.${audit.appellation_status}`) }}</div>
            <q-space />
            <my-button
              type="primary"
              :label="$t('send')"
              icon="add"
              @click="onSendAppellation"
              v-if="audit.appellation_status == 'none'"
            />
          </div>
        </q-scroll-area>
      </div>
    </closeable-content>
  </q-dialog>
</template>
<script setup lang="ts">
import { useDialogPluginComponent } from "quasar";
import { useProfileStore } from "src/stores/profile-store";
import { computed, defineAsyncComponent, onMounted, toRef } from "vue";
import { useI18n } from "vue-i18n";
import MyIcon from "../my/MyIcon.vue";
import MyButton from "../my/MyButton.vue";
import OpenUserDialog from "../profile/OpenUserDialog.vue";
import CloseableContent from "../misc/CloseableContent.vue";
import { formatUnixTime } from "src/utils/format";
import { sendAppellation } from "src/api/moderation";

const CommentComponent = defineAsyncComponent(() => import("src/components/posts/CommentComponent.vue"));
const PostComponent = defineAsyncComponent(() => import("src/components/posts/PostComponent.vue"));

const { t } = useI18n();
const profileStore = useProfileStore();
defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const props = defineProps<{
  audit: ModAudit;
}>();

const user = computed<User>(
  () =>
    profileStore.profiles[props.audit.old_content.user_id]?.data ?? {
      username: t("loading"),
      user_id: props.audit.old_content.user_id,
      created_at: 0
    }
);
const content = computed<(CommentWithUser & { _type: "comment" }) | (Post & { _type: "post" })>(() => {
  if (props.audit.target_type == "comment") {
    return {
      ...props.audit.old_content,
      user: user.value,
      _type: "comment"
    } as CommentWithUser & { _type: "comment" };
  } else if (props.audit.target_type == "post") {
    return {
      ...props.audit.old_content,
      user: user.value,
      _type: "post"
    } as Post & { _type: "post" };
  } else {
    throw new Error("Unknown type: " + (props.audit as Record<string, string>).target_type);
  }
});
const icons = {
  post: "article",
  comment: "chat_bubble"
};

async function onSendAppellation() {
  await sendAppellation(props.audit.id);
  toRef(props.audit).value.appellation_status = "pending";
}

onMounted(() => {
  void profileStore.getProfile(props.audit.old_content.user_id);
});
</script>
