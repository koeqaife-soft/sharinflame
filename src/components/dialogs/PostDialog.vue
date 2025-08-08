<template>
  <q-dialog
    transition-show="slide-up"
    transition-hide="slide-down"
    class="post-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    :key="post.post_id"
  >
    <closeable-content v-on:hide="dialogRef!.hide()">
      <div class="dialog-header" style="z-index: 2">
        <div class="horizontal-container label-container">
          <q-icon name="sym_r_article" class="header-icon" />
          <div>{{ $t("post") }}</div>
          <q-space />
          <q-btn flat round icon="sym_r_close" @click="dialogRef!.hide()" />
        </div>
      </div>

      <div class="dialog-content-inner">
        <q-scroll-area class="scroll-area fix-scroll-area" :visible="false">
          <div ref="postComponentRef">
            <post-component :post="postRef" :in-dialog="true" @delete-post="handleDeletePost" style="z-index: 2" />
          </div>

          <div class="sticky-label scroll-header q-pt-sm" :class="{ 'is-visible': headerVisible }">
            <div class="card dialog-section q-mb-sm" style="z-index: 2">
              <div class="horizontal-container">
                <q-icon name="sym_r_chat_bubble" class="icon" />
                <div>{{ $t("comments") }}</div>
                <q-space />
                <q-btn flat round icon="sym_r_refresh" @click="reloadComments" />
              </div>
            </div>
          </div>

          <div class="no-comments" v-if="showNoComments">{{ $t("no_comments") }}</div>
          <my-virtual-scroll
            :items="items"
            :margins="8"
            item-key="comment_id"
            @load-more="loadComments"
            @scroll="onScroll"
            :infinite-load-type="allowLoading ? 'bottom' : 'none'"
            :key="scrollKey"
            class="posts-infinite-scroll"
            ref="virtualScroll"
          >
            <template v-slot:default="{ item }">
              <comment-component :comment="item" class="q-mb-sm" @delete-comment="handleDeleteComment" />
            </template>
            <template v-slot:loading>
              <div class="row justify-center q-my-md">
                <q-spinner class="loading full-height q-my-md" size="40px" />
              </div>
            </template>
          </my-virtual-scroll>
          <div class="load-more-container" v-if="!allowLoading">
            <q-btn unelevated no-caps class="default-button load-more" @click="allowLoad" :label="$t('load_more')" />
          </div>
        </q-scroll-area>
        <q-separator class="q-mb-sm q-mt-sm" />
        <div class="card send-comment">
          <div class="card-section">
            <div class="horizontal-container align-end full-width">
              <user-avatar :me="true" />
              <q-input
                dense
                borderless
                rounded
                v-model="text"
                autogrow
                maxlength="1024"
                :label="$t('enter_comment')"
                class="full-width enter-comment"
                :disable="sending"
              />
              <q-btn
                round
                flat
                icon="sym_r_send"
                class="send-button"
                @click="sendComment"
                :loading="sending"
                :disable="text.length == 0"
              >
                <template v-slot:loading>
                  <q-spinner class="loading" />
                </template>
              </q-btn>
            </div>
          </div>
        </div>
      </div>
    </closeable-content>
  </q-dialog>
</template>

<script setup lang="ts">
import { defineAsyncComponent, type DefineComponent, nextTick, onMounted, onUnmounted, ref, toRef, watch } from "vue";
import PostComponent from "../posts/PostComponent.vue";
import CloseableContent from "../misc/CloseableContent.vue";
import MyVirtualScroll from "../misc/MyVirtualScroll.vue";
import { useDialogPluginComponent } from "quasar";
import { createComment, getComments } from "src/api/posts";
import { useProfileStore } from "src/stores/profile-store";
import { useMainStore } from "src/stores/main-store";

const CommentComponent = defineAsyncComponent(() => import("../posts/CommentComponent.vue"));
const UserAvatar = defineAsyncComponent(() => import("../profile/UserAvatar.vue"));

const props = withDefaults(
  defineProps<{
    post: Post;
    firstComment?: CommentWithUser;
    autoLoad?: boolean;
  }>(),
  {
    autoLoad: true
  }
);

const showNoComments = ref(false);

const mainStore = useMainStore();
const profileStore = useProfileStore();

const postRef = toRef(props.post);
const scrollKey = ref(Date.now());

const items = ref<CommentWithUser[]>([]);
const nextItems = ref<CommentWithUser[]>([]);

const headerVisible = ref(true);
const postComponentRef = ref<HTMLElement | null>(null);

const virtualScroll = ref<DefineComponent | null>(null);
const allowLoading = ref(props.autoLoad);

let hasMore = true;
let cursor: string | undefined;

const text = ref((postRef.value._meta?.text || "") as string);
const sending = ref(false);
watch(text, () => updateMeta("text", text.value));

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide } = useDialogPluginComponent();

function allowLoad() {
  allowLoading.value = true;
  void nextTick(() => {
    virtualScroll.value?.checkLoading();
  });
}

function onScroll(info: QScrollObserverDetails) {
  headerVisible.value = info.position.top < postComponentRef.value!.scrollHeight + 66 || info.direction == "up";
}

function reloadComments() {
  showNoComments.value = false;
  items.value = [];
  nextItems.value = [];
  scrollKey.value = Date.now();
  cursor = undefined;
  headerVisible.value = true;
}

function updateMeta<T>(key: string, value: T) {
  postRef.value._meta ||= {};
  postRef.value._meta[key] = value;
}

async function loadComments(index: number, done: (stop?: boolean) => void) {
  showNoComments.value = false;

  const toAdd: CommentWithUser[] = [];
  nextItems.value ??= [];
  try {
    if (nextItems.value.length === 0) {
      const r = await getComments(postRef.value.post_id, cursor);
      const apiLoaded = r.data.data.comments;
      hasMore = r.data.data.has_more;
      cursor = r.data.data.next_cursor;

      if (r.data.success) {
        const usersMap = r.data.data.users;
        nextItems.value.push(
          ...apiLoaded.map(
            (comment: Comment) =>
              ({
                ...comment,
                user: usersMap[comment.user_id]
              }) as CommentWithUser
          )
        );
      }
    }

    toAdd.push(...nextItems.value.splice(0, 5));

    if (toAdd.length > 0) {
      const currentComments = items.value;
      toAdd.forEach((newComment) => {
        const existingIndex = currentComments.findIndex((comment) => comment.comment_id === newComment.comment_id);

        if (existingIndex !== -1) {
          currentComments[existingIndex] = newComment;
        } else {
          currentComments.push(newComment);
        }
      });

      items.value = currentComments;
    }

    done(!(hasMore || nextItems.value.length > 0));
  } catch (e) {
    done(true);
    throw e;
  } finally {
    if (items.value.length == 0) {
      showNoComments.value = true;
    }
  }
}

async function sendComment() {
  sending.value = true;
  try {
    const r = await createComment(postRef.value.post_id, text.value);
    if (r.data.success) {
      const comment: CommentWithUser = {
        ...r.data.data,
        user: (await profileStore.getProfile())!
      };
      items.value.unshift(comment);

      text.value = "";
      postRef.value.comments_count += 1;
    }
  } finally {
    showNoComments.value = false;
    sending.value = false;
    virtualScroll.value?.updateShowedItems(1);
  }
}

function handleDeletePost() {
  dialogRef.value?.hide();
}

function handleDeleteComment(comment_id: string) {
  items.value = items.value.filter((comment) => comment.comment_id !== comment_id);
  postRef.value.comments_count -= 1;
  virtualScroll.value?.updateShowedItems();
}

onMounted(() => {
  mainStore.openedDialogs.post?.();
  mainStore.openedDialogs.post = dialogRef.value!.hide;
  if (props.firstComment) {
    items.value.push(props.firstComment);
  }
});

onUnmounted(() => {
  items.value = [];
  nextItems.value = [];
});
</script>
