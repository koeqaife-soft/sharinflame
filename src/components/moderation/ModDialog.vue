<template>
  <q-dialog
    transition-show="slide-up"
    transition-hide="slide-down"
    class="mod-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    :key="Date.now()"
  >
    <closeable-content v-on:hide="dialogRef!.hide()">
      <div class="dialog-header" style="z-index: 2">
        <div class="horizontal-container label-container">
          <my-icon icon="shield" class="header-icon" />
          <div class="label">{{ $t("moderation") }}</div>
          <q-space />
          <my-button icon="close" @click="dialogRef!.hide()" />
        </div>
      </div>
      <div class="dialog-content-inner">
        <div class="dialog-center" v-if="!assigned || Object.values(assigned).length == 0">
          <div class="loading" v-if="assigned == undefined">
            <my-spinner size="65px" />
          </div>
          <div class="no-work card" v-else>{{ $t("no_work_now") }}</div>
        </div>
        <template v-else>
          <q-scroll-area class="scroll-area fix-scroll-area">
            <div class="card section q-mb-sm">
              <my-icon :icon="icons[assigned.resource_type]" />
              <div class="note">{{ $t(assigned.resource_type) }}</div>
            </div>
            <post-component
              v-if="assigned.resource_type == 'post'"
              :post="assigned.loaded"
              show-mod-delete
              @delete-post="next"
            />
            <comment-component
              v-else-if="assigned.resource_type == 'comment'"
              :comment="assigned.loaded"
              show-mod-delete
              @delete-comment="next"
            />
            <div class="card section q-mb-sm q-mt-sm">
              <my-icon icon="report" />
              <div class="note">{{ $t("reports") }}</div>
            </div>
            <div class="reports" v-if="assigned.reports">
              <div class="card report q-mb-sm" v-for="(item, index) in assigned.reports" :key="index">
                <div class="username" @click="mainStore.openDialog('user', item.user.user_id, { user: item.user })">
                  {{ item.user.username }}:
                </div>
                <div class="reason">{{ item.reason }}</div>
              </div>
            </div>
          </q-scroll-area>
          <my-button
            :label="$t('approve')"
            icon-right="check"
            class="centered q-mt-sm full-width"
            type="outlined"
            @click="next"
          />
        </template>
      </div>
    </closeable-content>
  </q-dialog>
</template>
<script setup lang="ts">
import { useDialogPluginComponent } from "quasar";
import CloseableContent from "../misc/CloseableContent.vue";
import MySpinner from "../my/MySpinner.vue";
import MyIcon from "../my/MyIcon.vue";
import MyButton from "../my/MyButton.vue";
import { defineAsyncComponent, onMounted, onUnmounted, ref } from "vue";
import { dismissAssigned, getAssignedResource } from "src/api/moderation";
import { useMainStore } from "src/stores/main-store";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const CommentComponent = defineAsyncComponent(() => import("src/components/posts/CommentComponent.vue"));
const PostComponent = defineAsyncComponent(() => import("src/components/posts/PostComponent.vue"));

const mainStore = useMainStore();

interface Report {
  report_id: string;
  user_id: string;
  target_id: string;
  target_type: string;
  reason: string;
  status: string;
  user: User;
}

interface AssignedPost {
  resource_id: string;
  resource_type: "post";
  loaded: Post;
  reports: Report[];
}

interface AssignedComment {
  resource_id: string;
  resource_type: "comment";
  loaded: CommentWithUser;
  reports: Report[];
}

const icons = {
  post: "article",
  comment: "chat_bubble"
};

const assigned = ref<AssignedPost | AssignedComment | null>();
let onGrace = true;
let graceTimeout: NodeJS.Timeout | null = null;

async function load() {
  assigned.value = (await getAssignedResource()).data.data;
  onGrace = true;
  if (graceTimeout) clearTimeout(graceTimeout);
  graceTimeout = setTimeout(() => {
    onGrace = false;
  }, 1000);
}

async function next() {
  if (onGrace) return;
  if (!assigned.value) return;
  const id = assigned.value.resource_id;
  assigned.value = undefined;
  try {
    await dismissAssigned(id);
  } catch {
    // noop
  }
  await load();
}

onMounted(() => {
  void load();
});

onUnmounted(() => {
  if (graceTimeout) clearTimeout(graceTimeout);
});
</script>
