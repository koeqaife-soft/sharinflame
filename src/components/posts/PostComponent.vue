<template>
  <div class="post card" :key="postRef.post_id">
    <div class="content-section card-section">
      <div class="avatar-container" v-if="!postRef.is_system">
        <open-user-dialog :user="postRef.user" />
      </div>
      <div class="text-container">
        <div class="username">
          {{ postRef.is_system ? $t("system") : postRef.user.display_name || postRef.user.username }}
        </div>
        <text-parts class="content wrap-text" :text="formatStringForHtml(postRef.content)" :html="true" />
      </div>
    </div>
    <div class="post-image-section card-section" v-if="!postRef.is_system && postRef.media?.length > 0">
      <q-carousel
        class="post-image"
        animated
        arrows
        keep-alive
        swipeable
        transition-prev="slide-right"
        transition-next="slide-left"
        navigation
        v-model="currentSlide"
        v-model:fullscreen="isFullscreen"
      >
        <q-carousel-slide v-for="(src, index) in postRef.media" :key="index" :name="index" class="q-pa-none">
          <q-img :src="src" fit="contain" class="full-width full-height" />
        </q-carousel-slide>
      </q-carousel>
    </div>
    <div class="tags tags-section card-section" v-if="!postRef.is_system && postRef.tags?.length > 0">
      <q-chip
        v-for="(tag, index) in postRef.tags"
        :key="index"
        class="tag"
        :icon="$tagsInfo.value[tag]?.icon || 'sym_r_tag'"
        :disable="disable"
      >
        {{ $tagsInfo.value[tag]?.name || tag }}
      </q-chip>
    </div>
    <div class="actions card-section" :class="{ 'can-animate': canAnimate }" v-if="!postRef.is_system">
      <div class="reaction-buttons">
        <reaction-buttons :object="postRef" :before-action="allowAnimate" :is-comment="false" :disable="disable" />
      </div>
      <div class="action-container">
        <q-btn
          unelevated
          icon="sym_r_chat_bubble"
          :label="formatNumber(postRef.comments_count)"
          class="comments round button"
          size="sm"
          @click="postDialog"
          :disable="disable"
        />
      </div>
      <q-space />
      <div class="action-container circle">
        <q-btn unelevated icon="sym_r_more_horiz" class="more button circle" size="sm" :disable="disable">
          <q-menu class="post-more-menu" self="top right">
            <more-menu :post="postRef" @action="action" />
          </q-menu>
        </q-btn>
      </div>
    </div>
    <div class="actions card-section" v-else-if="postRef.actions">
      <div class="action-container" v-for="action in postRef.actions" :key="action.name">
        <q-btn
          unelevated
          no-caps
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
import { defineAsyncComponent, type Ref, ref, toRef } from "vue";
import { deletePost } from "src/api/posts";
import { formatNumber, formatStringForHtml } from "src/utils/format";
import { useQuasar } from "quasar";
import { i18n } from "src/boot/i18n";
import TextParts from "../misc/TextParts.vue";

const ReactionButtons = defineAsyncComponent(() => import("./ReactionButtons.vue"));
const OpenUserDialog = defineAsyncComponent(() => import("../dialogs/OpenUserDialog.vue"));
const PostDialog = defineAsyncComponent(() => import("../dialogs/PostDialog.vue"));
const MoreMenu = defineAsyncComponent(() => import("./PostMoreMenu.vue"));
const PostEditor = defineAsyncComponent(() => import("../dialogs/PostEditor.vue"));
const quasar = useQuasar();

const emit = defineEmits<{
  (event: "deletePost", postId: string): void;
}>();

const props = defineProps<{
  post: PostWithSystem;
  inDialog?: boolean;
}>();

const postRef = toRef(props.post);

const currentSlide: Ref<string | number> = ref(0);
const isFullscreen = ref(false);
const disable = ref(false);

const canAnimate = ref(false);

function allowAnimate() {
  canAnimate.value = true;
}

function postDialog() {
  if (props.inDialog) return;
  quasar.dialog({
    component: PostDialog,
    componentProps: {
      post: postRef.value
    }
  });
}

async function action(type: string, data: unknown) {
  const { t } = i18n.global;

  switch (type) {
    case "delete":
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

      break;
    case "edit":
      quasar.dialog({
        component: PostEditor,
        componentProps: {
          originalPost: props.post
        }
      });
      break;
    case "copy_id":
      void navigator.clipboard.writeText(data as string);
      break;
  }
}
</script>
