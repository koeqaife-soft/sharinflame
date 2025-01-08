<template>
  <q-card class="post card" unelevated :key="postRef.post_id">
    <q-card-section class="q-pb-none">
      <open-user-dialog :user="postRef.user" v-if="!postRef.is_system" />
      <div class="text-container">
        <div class="username">
          {{ postRef.is_system ? $t("system") : postRef.user.display_name || postRef.user.username }}
        </div>
        <div class="content wrap-text" v-html="formatStringForHtml(postRef.content)" />
      </div>
    </q-card-section>
    <q-card-section class="q-pb-none tags" v-if="!postRef.is_system && postRef.tags.length > 0">
      <q-chip v-for="(tag, index) in postRef.tags" :key="index" class="tag" :icon="tagsInfo[tag]?.icon || 'sym_r_tag'">
        {{ tagsInfo[tag]?.name || tag }}
      </q-chip>
    </q-card-section>
    <q-card-actions class="actions" v-if="!postRef.is_system">
      <div class="action-container">
        <q-btn
          unelevated
          icon="sym_r_thumb_up"
          :label="formatNumber(postRef.likes_count)"
          :class="['like round-left button', { active: postRef.is_like === true }]"
          size="sm"
          @click="like"
        />
        <q-separator vertical class="separator" />
        <q-btn
          unelevated
          icon="sym_r_thumb_down"
          :label="formatNumber(postRef.dislikes_count)"
          :class="['dislike round-right button', { active: postRef.is_like === false }]"
          size="sm"
          @click="dislike"
        />
      </div>
      <div class="action-container circle">
        <q-btn
          unelevated
          icon="sym_r_favorite"
          :class="['comments button circle', { active: postRef.is_fav }]"
          size="sm"
          @click="favoriteButton"
        />
      </div>
      <div class="action-container">
        <q-btn
          unelevated
          icon="sym_r_chat_bubble"
          :label="formatNumber(postRef.comments_count)"
          class="comments round button"
          size="sm"
          @click="postDialog"
        />
      </div>
      <q-space />
      <div class="action-container circle">
        <q-btn unelevated icon="sym_r_more_horiz" class="more button circle" size="sm">
          <q-menu class="post-more-menu" self="top right">
            <more-menu :post="postRef" @action="action" />
          </q-menu>
        </q-btn>
      </div>
    </q-card-actions>
    <q-card-actions class="actions" v-else-if="postRef.actions">
      <div class="action-container" v-for="action in postRef.actions" :key="action.name">
        <q-btn
          unelevated
          no-caps
          :icon="action.icon"
          :label="$t(action.name)"
          class="round button"
          size="sm"
          @click="action.func()"
        />
      </div>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, Ref, ref } from "vue";
import OpenUserDialog from "../dialogs/OpenUserDialog.vue";
import { deletePost } from "src/api/posts";
import { formatNumber, formatStringForHtml } from "src/utils/format";
import { useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import { useReaction } from "src/composables/useReaction";

const PostDialog = defineAsyncComponent(() => import("../dialogs/PostDialog.vue"));
const MoreMenu = defineAsyncComponent(() => import("./PostMoreMenu.vue"));
const quasar = useQuasar();
const { t } = useI18n();

const emit = defineEmits<{
  (event: "deletePost", postId: string): void;
}>();

const props = defineProps<{
  post: PostWithSystem;
  inDialog?: boolean;
}>();

const postRef = ref<PostWithSystem>(props.post);

let like = () => {};
let dislike = () => {};
let favoriteButton = () => {};

if (!postRef.value.is_system) {
  ({ like, dislike, favoriteButton } = useReaction(postRef as unknown as Ref<Post>, true));
}

const tagsInfo = computed<Record<string, { name: string; icon: string }>>(() => ({
  "ai-generated": {
    name: t("tag.ai_name"),
    icon: "sym_r_robot_2"
  },
  "is-nsfw": {
    name: t("tag.nsfw_name"),
    icon: "sym_r_explicit"
  }
}));

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
      } catch (e) {
        quasar.notify({
          type: "error-notification",
          progress: true,
          message: t("post_deleted.failed")
        });
        throw e;
      }

      break;
    case "copy_id":
      navigator.clipboard.writeText(data as string);
      break;
  }
}
</script>
