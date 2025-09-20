<template>
  <div class="post card" :class="{ 'is-system': postRef.is_system }" :key="postRef.post_id">
    <div class="content-section card-section">
      <div class="avatar-container" v-if="!postRef.is_system">
        <open-user-dialog :user="postRef.user" />
      </div>
      <my-icon icon="chat_info" v-if="postRef.is_system" />
      <div class="text-container">
        <div class="username" v-if="!postRef.is_system">
          {{ postRef.user.display_name || postRef.user.username }}
        </div>
        <text-parts class="content wrap-text" :text="formatStringForHtml(postRef.content)" :html="true" />
      </div>
    </div>
    <div class="post-file-section card-section" v-if="!postRef.is_system && postRef.media?.length > 0">
      <template v-if="postRef.media_type == 'post_image'">
        <my-carousel class="post-image" :slides="postRef.media.sort()">
          <template v-slot:default="{ data }">
            <my-image :src="data" />
          </template>
        </my-carousel>
      </template>
      <template v-else-if="postRef.media_type == 'post_video'">
        <video-payer :src="postRef.media[0]!" />
      </template>
    </div>
    <div
      class="tags tags-section card-section"
      v-if="!postRef.is_system && (postRef.tags?.length > 0 || postRef.ctags?.length > 0)"
    >
      <my-chip
        v-for="(tag, index) in postRef.ctags"
        :key="index"
        class="tag"
        icon="tag"
        :disable="disable"
        @click="mainStore.openDialog('tag', tag, { tagName: tag })"
        :label="tag"
        :clickable="true"
      />
      <my-chip
        v-for="(tag, index) in postRef.tags"
        :key="index"
        class="tag"
        :icon="$tagsInfo.value[tag]?.icon || 'experiment'"
        :disable="disable"
        :label="$tagsInfo.value[tag]?.name || tag"
      />
    </div>
    <div class="actions card-section" :class="{ 'can-animate': canAnimate }" v-if="!postRef.is_system">
      <div class="reaction-buttons">
        <reaction-buttons
          :object="postRef"
          :before-action="allowAnimate"
          :is-comment="false"
          :disable="disableActions || disable"
        />
      </div>
      <div class="action-container">
        <my-button
          icon="chat_bubble"
          :label="formatNumber(postRef.comments_count)"
          class="comments round button"
          size="sm"
          @click="postDialog"
          :disable="disableActions || disable"
        />
      </div>
      <q-space />
      <div class="action-container circle" v-if="showModDelete">
        <my-button
          icon="delete_forever"
          class="delete circle button"
          :disable="disable"
          @click="action('mod_delete', null)"
        />
      </div>
      <div class="action-container circle" v-if="!disableActions">
        <my-button icon="more_horiz" class="more button circle" :disable="disable">
          <q-menu class="post-more-menu" self="top right">
            <more-menu :post="postRef" @action="action" />
          </q-menu>
        </my-button>
      </div>
    </div>
    <div class="actions card-section" v-else-if="postRef.actions">
      <div class="action-container" v-for="action in postRef.actions" :key="action.name">
        <my-button
          :icon="action.icon"
          :label="$t(action.name)"
          class="round button"
          size="sm"
          @click="action.func()"
          :disable="disable"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, toRef } from "vue";
import { deletePost } from "src/api/posts";
import { formatNumber, formatStringForHtml } from "src/utils/format";
import { useQuasar } from "quasar";
import { i18n } from "src/boot/i18n";
import TextParts from "../misc/TextParts.vue";
import MyChip from "../my/MyChip.vue";
import MyButton from "../my/MyButton.vue";
import ReactionButtons from "./ReactionButtons.vue";
import MyIcon from "../my/MyIcon.vue";
import { useMainStore } from "src/stores/main-store";

const MyImage = defineAsyncComponent(() => import("../my/MyImage.vue"));
const MyCarousel = defineAsyncComponent(() => import("../my/MyCarousel.vue"));
const VideoPayer = defineAsyncComponent(() => import("../my/MyVideoPlayer.vue"));
const OpenUserDialog = defineAsyncComponent(() => import("../profile/OpenUserDialog.vue"));
const MoreMenu = defineAsyncComponent(() => import("./PostMoreMenu.vue"));
const PostEditor = defineAsyncComponent(() => import("./PostEditor.vue"));
const quasar = useQuasar();
const mainStore = useMainStore();

const emit = defineEmits<{
  (event: "deletePost", postId: string): void;
}>();

const props = defineProps<{
  post: PostWithSystem;
  inDialog?: boolean;
  disableActions?: boolean;
  showModDelete?: boolean;
}>();

const postRef = toRef(props.post);

const disable = ref(false);

const canAnimate = ref(false);

function allowAnimate() {
  canAnimate.value = true;
}

function postDialog() {
  if (props.inDialog) return;
  mainStore.openDialog("post", postRef.value.post_id, { post: postRef.value });
}

async function onDeletePost() {
  const { t } = i18n.global;
  try {
    await deletePost(postRef.value.post_id);
    quasar.notify({
      type: "default-notification",
      progress: true,
      icon: "sym_r_delete_forever",
      message: t("post_deleted.msg"),
      caption: t("post_deleted.caption")
    });
    emit("deletePost", postRef.value.post_id);
    disable.value = true;
  } catch (e) {
    quasar.notify({
      type: "error-notification",
      progress: true,
      message: t("post_deleted.failed")
    });
    throw e;
  }
}

function action(type: string, data: unknown) {
  switch (type) {
    case "delete":
      mainStore.openDialog(
        "okCancel",
        "",
        {
          localeKey: "delete_post_dialog",
          okKey: "delete",
          okType: "attention",
          okIcon: "delete_forever"
        },
        () => void onDeletePost()
      );
      break;
    case "mod_delete":
      mainStore.openDialog(
        "modDelete",
        "",
        {
          targetType: "post",
          postId: postRef.value.post_id
        },
        () => emit("deletePost", postRef.value.post_id)
      );
      break;
    case "edit":
      quasar.dialog({
        component: PostEditor,
        componentProps: {
          originalPost: props.post
        }
      });
      break;
    case "report":
      mainStore.openDialog("report", "", { targetType: "post", targetId: postRef.value.post_id });
      break;
    case "copy_id":
      void navigator.clipboard.writeText(data as string);
      break;
  }
}
</script>
