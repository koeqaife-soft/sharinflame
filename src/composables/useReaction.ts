import { Ref } from "vue";
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

export function useReaction(itemRef: Ref<ReactionItem>, isComment = false, beforeAction: () => void = () => {}) {
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

    debounce(() => performReaction(isLike), 500);
  }

  function updateReactionCounters(isLike: boolean) {
    if (itemRef.value.is_like === isLike) {
      itemRef.value.is_like = undefined;
      isLike ? itemRef.value.likes_count-- : itemRef.value.dislikes_count--;
    } else {
      if (itemRef.value.is_like !== undefined) {
        isLike ? itemRef.value.dislikes_count-- : itemRef.value.likes_count--;
      }
      isLike ? itemRef.value.likes_count++ : itemRef.value.dislikes_count++;
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
    beforeAction();
    handleReaction(true);
  }

  function dislike() {
    beforeAction();
    handleReaction(false);
  }

  async function performFavorite(to: boolean) {
    if (lastFavorite === to) return;
    try {
      if (to === true) {
        if (isComment) {
          await addCommentToFavorites(itemRef.value.post_id, itemRef.value.comment_id!);
        } else {
          await addPostToFavorites(itemRef.value.post_id);
        }
      } else {
        if (isComment) {
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

  async function favoriteButton() {
    beforeAction();
    if (debounceTimeoutFav !== null) clearTimeout(debounceTimeoutFav);

    const changeTo = !itemRef.value.is_fav;
    debounceTimeoutFav = setTimeout(() => performFavorite(changeTo), 500);

    itemRef.value.is_fav = changeTo;
  }

  return {
    like,
    dislike,
    favoriteButton
  };
}
