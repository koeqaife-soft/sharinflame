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
import { computed, defineAsyncComponent, ref } from "vue";
import OpenUserDialog from "../dialogs/OpenUserDialog.vue";
import { remReaction, setReaction } from "src/api/posts";
import { formatNumber, formatStringForHtml } from "src/utils/format";
import { useQuasar } from "quasar";
import { useI18n } from "vue-i18n";

const PostDialog = defineAsyncComponent(() => import("../dialogs/PostDialog.vue"));
const quasar = useQuasar();
const { t } = useI18n();

const props = defineProps<{
  post: PostWithSystem;
  inDialog?: boolean;
}>();

const postRef = ref<PostWithSystem>(props.post);
let lastReaction: boolean | undefined = false;
let lastCounters: number[] = [];
if (!postRef.value.is_system) {
  lastReaction = postRef.value.is_like;
  lastCounters = [postRef.value.likes_count, postRef.value.dislikes_count];
}

let blockLastReaction = false;

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

let debounceTimeout: NodeJS.Timeout | null = null;

function debounce(callback: () => void, delay: number) {
  if (debounceTimeout !== null) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(callback, delay);
}

function changeLastReaction(reaction: boolean | undefined, counters: typeof lastCounters) {
  if (blockLastReaction) return;
  lastReaction = reaction;
  lastCounters = counters;
}

function handleReaction(isLike: boolean) {
  if (postRef.value.is_system) return;

  const { is_like, likes_count, dislikes_count } = postRef.value;

  changeLastReaction(is_like, [likes_count, dislikes_count]);
  blockLastReaction = true;
  updateReactionCounters(isLike);

  debounce(() => performReaction(isLike), 500);
}

function updateReactionCounters(isLike: boolean) {
  if (postRef.value.is_system) return;

  if (postRef.value.is_like === isLike) {
    postRef.value.is_like = undefined;
    isLike ? postRef.value.likes_count-- : postRef.value.dislikes_count--;
  } else {
    if (postRef.value.is_like !== undefined) {
      isLike ? postRef.value.dislikes_count-- : postRef.value.likes_count--;
    }
    isLike ? postRef.value.likes_count++ : postRef.value.dislikes_count++;
    postRef.value.is_like = isLike;
  }
}

function backReactionCounters() {
  if (postRef.value.is_system || postRef.value.is_like === lastReaction) return;

  postRef.value.is_like = lastReaction;
  postRef.value.likes_count = lastCounters[0];
  postRef.value.dislikes_count = lastCounters[1];
}

async function performReaction(isLike: boolean) {
  if (postRef.value.is_system) return;

  try {
    if (postRef.value.is_like === lastReaction) return;
    if (postRef.value.is_like === undefined) {
      await remReaction(postRef.value.post_id);
    } else {
      await setReaction(postRef.value.post_id, { isLike });
    }
  } catch (error) {
    backReactionCounters();
    quasar.notify({
      type: "error-notification",
      message: t("reaction_failed"),
      progress: true
    });
    console.error(error);
  } finally {
    blockLastReaction = false;
  }
}

function like() {
  handleReaction(true);
}

function dislike() {
  handleReaction(false);
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
</script>
