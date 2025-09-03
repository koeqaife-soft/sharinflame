<template>
  <q-dialog
    transition-show="slide-up"
    transition-hide="slide-down"
    class="comment-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    :key="comment.comment_id"
  >
    <closeable-content v-on:hide="dialogRef!.hide()">
      <div class="dialog-header" style="z-index: 2">
        <div class="horizontal-container label-container">
          <my-icon icon="chat_bubble" class="header-icon" />
          <div>{{ $t("comment") }}</div>
          <q-space />
          <my-button icon="close" @click="dialogRef!.hide()" />
        </div>
      </div>

      <div class="dialog-content-inner">
        <q-scroll-area class="scroll-area fix-scroll-area" :visible="false">
          <div ref="commentComponentRef">
            <comment-component
              :comment="commentRef"
              :in-dialog="props.inDialog"
              :in-replies-dialog="true"
              @delete-comment="handleDeleteMainComment"
              style="z-index: 2"
            />
          </div>

          <div class="sticky-label scroll-header q-pt-sm" :class="{ 'is-visible': headerVisible }">
            <div class="card dialog-section q-mb-sm" style="z-index: 2">
              <div class="horizontal-container">
                <my-icon icon="reply" class="icon" />
                <div>{{ $t("replies") }}</div>
                <q-space />
                <my-button icon="refresh" @click="reloadComments" />
              </div>
            </div>
          </div>

          <div class="no-comments" v-if="showNoComments">
            {{ $t("no_replies") }}
          </div>
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
            <template v-slot:default="{ item, index }">
              <comment-component
                :comment="item"
                :class="{ 'q-mb-sm': index + 1 < items.length }"
                @delete-comment="handleDeleteComment"
                :in-dialog="inDialog!"
                :hide-go-to="true"
              />
            </template>
            <template v-slot:loading>
              <div class="row justify-center q-my-md">
                <q-spinner class="loading full-height q-my-md" size="40px" />
              </div>
            </template>
          </my-virtual-scroll>
          <div class="load-more-container" v-if="!allowLoading">
            <my-button
              class="load-more"
              type="primary"
              @click="allowLoad"
              icon-right="arrow_circle_down"
              :label="$t('load_more')"
            />
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
                :label="$t('enter_reply')"
                class="full-width enter-comment"
                :disable="sending"
                @keydown.enter="sendComment"
              />
              <my-button
                icon="send"
                class="send-button"
                @click="sendComment"
                :loading="sending"
                :disable="text.length == 0"
              />
            </div>
          </div>
        </div>
      </div>
    </closeable-content>
  </q-dialog>
</template>

<script setup lang="ts">
import { defineAsyncComponent, type DefineComponent, nextTick, onMounted, onUnmounted, ref, toRef, watch } from "vue";
import CloseableContent from "../misc/CloseableContent.vue";
import MyVirtualScroll from "../my/MyVirtualScroll.vue";
import { useDialogPluginComponent } from "quasar";
import { createComment, getComments } from "src/api/posts";
import { useProfileStore } from "src/stores/profile-store";
import MyIcon from "../my/MyIcon.vue";
import MyButton from "../my/MyButton.vue";

const CommentComponent = defineAsyncComponent(() => import("../posts/CommentComponent.vue"));
const UserAvatar = defineAsyncComponent(() => import("../profile/UserAvatar.vue"));

const props = withDefaults(
  defineProps<{
    comment: CommentWithUser;
    firstComment?: CommentWithUser;
    autoLoad?: boolean;
    onDelete?: () => void;
    inDialog?: boolean;
  }>(),
  {
    autoLoad: true,
    inDialog: true
  }
);

const showNoComments = ref(false);

const profileStore = useProfileStore();

const commentRef = toRef(props.comment);
const scrollKey = ref(Date.now());

const items = ref<CommentWithUser[]>([]);
const nextItems = ref<CommentWithUser[]>([]);

const headerVisible = ref(true);
const commentComponentRef = ref<HTMLElement | null>(null);

const virtualScroll = ref<DefineComponent | null>(null);
const allowLoading = ref(props.autoLoad);

let hasMore = true;
let cursor: string | undefined;
let controller = new AbortController();

const text = ref((commentRef.value._meta?.text || "") as string);
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
  headerVisible.value = info.position.top < commentComponentRef.value!.scrollHeight + 66 || info.direction == "up";
}

function reloadComments() {
  controller.abort();
  controller = new AbortController();
  showNoComments.value = false;
  items.value = [];
  nextItems.value = [];
  scrollKey.value = Date.now();
  cursor = undefined;
  headerVisible.value = true;
  if (!allowLoading.value) allowLoad();
}

function updateMeta<T>(key: string, value: T) {
  commentRef.value._meta ||= {};
  commentRef.value._meta[key] = value;
}

async function loadComments(index: number, done: (stop?: boolean) => void) {
  showNoComments.value = false;

  const toAdd: CommentWithUser[] = [];
  nextItems.value ??= [];
  try {
    if (nextItems.value.length === 0) {
      const r = await getComments(
        commentRef.value.post_id,
        cursor,
        undefined,
        { signal: controller.signal },
        commentRef.value.comment_id
      );
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

async function sendComment(event?: KeyboardEvent | MouseEvent) {
  if (event instanceof KeyboardEvent && event.shiftKey) return;
  sending.value = true;
  try {
    const r = await createComment(
      commentRef.value.post_id,
      text.value,
      undefined,
      undefined,
      commentRef.value.comment_id
    );
    if (r.data.success) {
      const comment: CommentWithUser = {
        ...r.data.data,
        user: (await profileStore.getProfile())!
      };
      items.value.unshift(comment);

      text.value = "";
      commentRef.value.replies_count += 1;
    }
  } finally {
    showNoComments.value = false;
    sending.value = false;
    void nextTick(() => virtualScroll.value?.updateShowedItems(1));
  }
}

function handleDeleteMainComment() {
  dialogRef.value?.hide();
  if (props.onDelete) props.onDelete();
}

function handleDeleteComment(comment_id: string) {
  items.value = items.value.filter((comment) => comment.comment_id !== comment_id);
  commentRef.value.replies_count -= 1;
  void nextTick(() => virtualScroll.value?.updateShowedItems());
}

onMounted(() => {
  if (props.firstComment) {
    items.value.push(props.firstComment);
  }
});

onUnmounted(() => {
  items.value = [];
  nextItems.value = [];
  controller.abort();
});
</script>
