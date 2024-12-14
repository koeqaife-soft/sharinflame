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
      <card-dialog-label class="q-mb-sm" :label="$t('post')" icon="sym_r_article">
        <q-btn flat round icon="sym_r_close" size="xs" @click="dialogRef!.hide()" />
      </card-dialog-label>
      <q-scroll-area class="scroll-area fix-scroll-area" :visible="false">
        <post-component :post="postRef" :in-dialog="true" class="q-mb-sm" />
        <q-separator class="q-mb-sm" />
        <div class="sticky-label">
          <card-dialog-label class="q-mb-sm" :label="$t('comments')" icon="sym_r_chat_bubble">
            <q-btn flat round icon="sym_r_refresh" size="xs" @click="reloadComments" />
          </card-dialog-label>
        </div>
        <q-infinite-scroll @load="loadComments" class="posts-infinite-scroll full-height" :key="scrollKey" debounce="0">
          <comment-component
            :comment="item"
            class="animation-fade-in-down"
            v-for="item in items"
            :key="item.comment_id"
          />
          <template v-slot:loading>
            <div class="row justify-center q-my-md">
              <q-spinner class="loading" size="40px" />
            </div>
          </template>
        </q-infinite-scroll>
      </q-scroll-area>
      <q-separator class="q-mb-sm q-mt-sm" />
      <q-card class="card send-comment">
        <q-card-section>
          <div class="horizontal-container align-end">
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
        </q-card-section>
      </q-card>
    </closeable-content>
  </q-dialog>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted, onUnmounted, ref, watch } from "vue";
import PostComponent from "../posts/PostComponent.vue";
import CloseableContent from "../misc/CloseableContent.vue";
import CardDialogLabel from "../misc/CardDialogLabel.vue";
import { useDialogPluginComponent } from "quasar";
import { createComment, getComments } from "src/api/posts";
import { useProfileStore } from "src/stores/profile-store";
import { useMainStore } from "src/stores/main-store";

const CommentComponent = defineAsyncComponent(() => import("../posts/CommentComponent.vue"));
const UserAvatar = defineAsyncComponent(() => import("../profile/UserAvatar.vue"));

const props = defineProps<{
  post: Post;
}>();

const mainStore = useMainStore();
const profileStore = useProfileStore();

const postRef = ref(props.post);
const scrollKey = ref(Date.now());

const items = ref<CommentWithUser[]>([]);
const nextItems = ref<CommentWithUser[]>([]);

let hasMore = true;
let cursor: string | undefined;

const text = ref((postRef.value._meta?.text || "") as string);
const sending = ref(false);
watch(text, () => updateMeta("text", text.value));

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide } = useDialogPluginComponent();

function reloadComments() {
  items.value = [];
  nextItems.value = [];
  scrollKey.value = Date.now();
  cursor = undefined;
}

function updateMeta<T>(key: string, value: T) {
  postRef.value._meta ||= {};
  postRef.value._meta[key] = value;
}

async function loadComments(index: number, done: (stop?: boolean) => void) {
  console.log(scrollKey.value);
  const toAdd: CommentWithUser[] = [];
  nextItems.value ??= [];
  let usedApi = false;
  try {
    if (nextItems.value.length === 0) {
      console.log("LOAD");
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
              } as CommentWithUser)
          )
        );
        usedApi = true;
      }
    }

    toAdd.push(...nextItems.value.splice(0, 5));
    console.log(toAdd);

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

    const _done = () => done(!(hasMore || nextItems.value.length > 0));

    if (usedApi) {
      setTimeout(() => {
        _done();
      }, 100);
    } else {
      _done();
    }
  } catch (e) {
    done(true);
    throw e;
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
    sending.value = false;
  }
}

onMounted(async () => {
  mainStore.openedDialogs.post();
  mainStore.openedDialogs.post = dialogRef.value!.hide;
});

onUnmounted(async () => {
  items.value = [];
  nextItems.value = [];
});
</script>
