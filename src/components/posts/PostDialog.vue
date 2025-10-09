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
          <my-icon icon="article" class="header-icon" />
          <div class="label">{{ $t("post") }}</div>
          <q-space />
          <my-button icon="close" @click="dialogRef!.hide()" />
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
                <my-select :options="select" v-model="currentType" />
                <q-space />
                <my-button icon="refresh" @click="reloadComments" />
              </div>
            </div>
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
            :skeleton-height="126"
            :no-items-key="currentType == 'comment' ? 'no_comments' : 'no_updates'"
          >
            <template v-slot:default="{ item, index }">
              <comment-component
                :comment="item"
                :class="{ 'q-mb-sm': index + 1 < items.length }"
                @delete-comment="handleDeleteComment"
                :in-dialog="true"
                show-replies
              />
            </template>
            <template v-slot:skeleton>
              <rect-skeleton height="126px" class="card q-mb-sm" />
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
        <q-separator class="q-mb-sm q-mt-sm" v-if="canWriteComment" />
        <div class="card send-comment" v-if="canWriteComment">
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
                :label="currentType == 'comment' ? $t('enter_comment') : $t('add_update')"
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
import {
  defineAsyncComponent,
  type DefineComponent,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  toRef,
  watch,
  computed
} from "vue";
import PostComponent from "../posts/PostComponent.vue";
import CloseableContent from "../misc/CloseableContent.vue";
import MyVirtualScroll from "../my/MyVirtualScroll.vue";
import { useDialogPluginComponent } from "quasar";
import { createComment, getComments } from "src/api/posts";
import { useProfileStore } from "src/stores/profile-store";
import MyIcon from "../my/MyIcon.vue";
import MyButton from "../my/MyButton.vue";
import MySelect from "../my/MySelect.vue";
import RectSkeleton from "src/components/skeletons/RectSkeleton.vue";

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

const profileStore = useProfileStore();

const postRef = toRef(props.post);
const scrollKey = ref(Date.now());

const items = ref<CommentWithUser[]>([]);
const nextItems = ref<CommentWithUser[]>([]);

const headerVisible = ref(true);
const postComponentRef = ref<HTMLElement | null>(null);

const virtualScroll = ref<DefineComponent | null>(null);
const allowLoading = ref(props.autoLoad);
const currentType = ref<"comment" | "update">(props.firstComment?.type ?? "comment");
const canWriteComment = computed(
  () =>
    currentType.value == "comment" ||
    (currentType.value == "update" && postRef.value.user_id == profileStore.profile?.user_id)
);

const select = [
  {
    key: "comment",
    labelKey: "comments",
    icon: "chat_bubble"
  },
  {
    key: "update",
    labelKey: "updates",
    icon: "update"
  }
];

watch(currentType, () => {
  reloadComments();
});

let hasMore = true;
let cursor: string | undefined;
let controller = new AbortController();

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
  controller.abort();
  controller = new AbortController();
  items.value = [];
  nextItems.value = [];
  scrollKey.value = Date.now();
  cursor = undefined;
  headerVisible.value = true;
  if (!allowLoading.value) allowLoad();
}

function updateMeta<T>(key: string, value: T) {
  postRef.value._meta ||= {};
  postRef.value._meta[key] = value;
}

function attachUsersToComments(comments: Comment[], usersMap: Record<string, User>): CommentWithUser[] {
  return comments.map((comment) => {
    const withUser: CommentWithUser = {
      ...comment,
      user: usersMap[comment.user_id]!,
      replies: comment.replies ? attachUsersToComments(comment.replies, usersMap) : []
    };
    return withUser;
  });
}

async function loadComments(index: number, done: (stop?: boolean) => void) {
  const toAdd: CommentWithUser[] = [];
  nextItems.value ??= [];
  try {
    if (nextItems.value.length === 0) {
      const r = await getComments(postRef.value.post_id, cursor, currentType.value, { signal: controller.signal });
      const apiLoaded = r.data.data.comments;
      hasMore = r.data.data.has_more;
      cursor = r.data.data.next_cursor;

      if (r.data.success) {
        const usersMap = r.data.data.users;
        nextItems.value.push(...attachUsersToComments(apiLoaded, usersMap));
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
  }
}

async function sendComment(event?: KeyboardEvent | MouseEvent) {
  if (event instanceof KeyboardEvent && event.shiftKey) return;
  sending.value = true;
  try {
    const r = await createComment(postRef.value.post_id, text.value, currentType.value);
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
    sending.value = false;
    void nextTick(() => virtualScroll.value?.updateShowedItems(1));
  }
}

function handleDeletePost() {
  dialogRef.value?.hide();
}

function handleDeleteComment(comment_id: string) {
  items.value = items.value.filter((comment) => comment.comment_id !== comment_id);
  postRef.value.comments_count -= 1;
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
