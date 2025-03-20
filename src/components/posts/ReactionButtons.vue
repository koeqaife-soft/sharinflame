<template>
  <div class="action-container">
    <q-btn
      unelevated
      icon="sym_r_thumb_up"
      :label="formatNumber(itemRef.likes_count)"
      :class="['like round-left button', { active: itemRef.is_like === true }]"
      size="sm"
      @click="like"
      :disable="disable"
    />
    <q-separator vertical class="separator" />
    <q-btn
      unelevated
      icon="sym_r_thumb_down"
      :label="formatNumber(itemRef.dislikes_count)"
      :class="['dislike round-right button', { active: itemRef.is_like === false }]"
      size="sm"
      @click="dislike"
      :disable="disable"
    />
  </div>
  <div class="action-container circle">
    <q-btn
      unelevated
      icon="sym_r_favorite"
      :class="['favorite button circle', { active: itemRef.is_fav }]"
      size="sm"
      @click="favoriteButton"
      :disable="disable"
    />
  </div>
</template>
<script setup lang="ts">
import { toRef } from "vue";
import { formatNumber } from "src/utils/format";
import { useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import { remReaction, setReaction } from "src/api/posts";
import {
  addCommentToFavorites,
  remCommentFromFavorites,
  addPostToFavorites,
  remPostFromFavorites
} from "src/api/users";

export interface ReactionItem {
  post_id: string;
  comment_id?: string;

  likes_count: number;
  dislikes_count: number;

  is_fav?: boolean | undefined;
  is_like?: boolean | undefined;
}

const props = defineProps<{
  object: ReactionItem;
  beforeAction?: () => void;
  isComment: boolean;
  disable?: boolean;
}>();

const itemRef = toRef(props.object);

const quasar = useQuasar();
const { t } = useI18n();

let debounceTimeoutFav: NodeJS.Timeout | null = null;
let lastFavorite = itemRef.value.is_fav;

let debounceTimeout: NodeJS.Timeout | null = null;
let lastReaction = itemRef.value.is_like;
let lastCounters = [itemRef.value.likes_count, itemRef.value.dislikes_count];
let blockLastReaction = false;

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
  const { is_like, likes_count, dislikes_count } = itemRef.value;

  changeLastReaction(is_like, [likes_count, dislikes_count]);
  blockLastReaction = true;
  updateReactionCounters(isLike);

  debounce(() => void performReaction(isLike), 500);
}

function updateReactionCounters(isLike: boolean) {
  if (itemRef.value.is_like === isLike) {
    itemRef.value.is_like = undefined;
    if (isLike) itemRef.value.likes_count--;
    else itemRef.value.dislikes_count--;
  } else {
    if (itemRef.value.is_like !== undefined) {
      if (isLike) itemRef.value.dislikes_count--;
      else itemRef.value.likes_count--;
    }
    if (isLike) itemRef.value.likes_count++;
    else itemRef.value.dislikes_count++;
    itemRef.value.is_like = isLike;
  }
}

function backReactionCounters() {
  if (itemRef.value.is_like === lastReaction) return;

  itemRef.value.is_like = lastReaction;
  itemRef.value.likes_count = lastCounters[0]!;
  itemRef.value.dislikes_count = lastCounters[1]!;
}

async function performReaction(isLike: boolean) {
  try {
    if (itemRef.value.is_like === lastReaction) return;
    if (itemRef.value.is_like === undefined) {
      await remReaction(itemRef.value.post_id, itemRef.value.comment_id);
    } else {
      await setReaction(itemRef.value.post_id, { isLike, commentId: itemRef.value.comment_id });
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
  if (props.beforeAction) props.beforeAction();
  handleReaction(true);
}

function dislike() {
  if (props.beforeAction) props.beforeAction();
  handleReaction(false);
}

async function performFavorite(to: boolean) {
  if (lastFavorite === to) return;
  try {
    if (to === true) {
      if (props.isComment) {
        await addCommentToFavorites(itemRef.value.post_id, itemRef.value.comment_id!);
      } else {
        await addPostToFavorites(itemRef.value.post_id);
      }
    } else {
      if (props.isComment) {
        await remCommentFromFavorites(itemRef.value.post_id, itemRef.value.comment_id!);
      } else {
        await remPostFromFavorites(itemRef.value.post_id);
      }
    }
    lastFavorite = to;
  } catch (error) {
    itemRef.value.is_fav = lastFavorite;
    quasar.notify({
      type: "error-notification",
      message: t("favorite_failed"),
      progress: true
    });
    console.error(error);
  }
}

function favoriteButton() {
  if (props.beforeAction) props.beforeAction();
  if (debounceTimeoutFav !== null) clearTimeout(debounceTimeoutFav);

  const changeTo = !itemRef.value.is_fav;
  debounceTimeoutFav = setTimeout(() => void performFavorite(changeTo), 500);

  itemRef.value.is_fav = changeTo;
}
</script>
