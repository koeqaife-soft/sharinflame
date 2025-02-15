<template>
  <q-dialog
    transition-show="slide-up"
    transition-hide="slide-down"
    class="create-post-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
  >
    <div class="dialog-content">
      <card-dialog-label
        class="q-mb-sm"
        :icon="editMode ? 'sym_r_edit' : 'sym_r_article'"
        :label="editMode ? $t('edit_post') : $t('create_post')"
      >
        <q-btn flat round icon="sym_r_close" size="xs" @click="dialogRef!.hide()" />
      </card-dialog-label>
      <q-separator class="separator q-mb-sm" />
      <q-scroll-area class="scroll-area fix-scroll-area" :visible="false">
        <q-input
          borderless
          v-model="text"
          autogrow
          maxlength="16384"
          :label="$t('add_your_text_here')"
          class="full-width post-text card"
          :disable="loading"
        />
        <div class="tags-container card">
          <div class="horizontal-container">
            <q-icon name="sym_r_tag" class="icon" />
            <div class="label">{{ $t("tags") }}</div>
          </div>
          <div class="chips">
            <q-chip
              v-for="(tag, index) in tags"
              :key="index"
              removable
              icon-remove="sym_r_close"
              @remove="removeTag(index)"
              class="tag"
            >
              {{ tag }}
            </q-chip>
            <q-chip clickable icon="sym_r_add" class="tag" :disable="tags.length >= MAX_TAGS">
              {{ $t("add_tag") }}
              <q-menu class="menu-card enter-tag-menu" v-if="tags.length < MAX_TAGS">
                <q-input
                  v-model="addTagValue"
                  :label="$t('enter_tag')"
                  @keyup.enter="addTag"
                  borderless
                  class="tag-input full-width"
                >
                  <template v-slot:append>
                    <q-btn
                      round
                      flat
                      icon="sym_r_add"
                      class="send-button"
                      @click="addTag"
                      :disable="addTagValue.length == 0"
                    />
                  </template>
                </q-input>
              </q-menu>
            </q-chip>
          </div>
        </div>

        <q-separator class="separator" />
        <toggle-value t_key="nsfw" icon="sym_r_explicit" v-model="is_nsfw" />
        <toggle-value t_key="ai" icon="sym_r_robot_2" v-model="ai_generated" />
      </q-scroll-area>
      <q-separator class="separator q-my-sm" />
      <div class="send-container">
        <q-btn
          class="default-button"
          :icon-right="editMode ? 'sym_r_edit' : 'sym_r_add'"
          :label="editMode ? $t('apply') : $t('create')"
          no-caps
          @click="buttonClick"
          :disable="text.length == 0"
          :loading="loading"
        />
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from "quasar";
import { defineAsyncComponent, onMounted, Ref, ref } from "vue";
import CardDialogLabel from "../misc/CardDialogLabel.vue";
import ToggleValue from "./create-post/ToggleValue.vue";
import { createPost, editPost } from "src/api/posts";
import { useProfileStore } from "src/stores/profile-store";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  originalPost?: Post;
}>();

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const PostDialog = defineAsyncComponent(() => import("./PostDialog.vue"));

const quasar = useQuasar();
const profileStore = useProfileStore();
const { t } = useI18n();

const text = ref<string>("");
const addTagValue = ref<string>("");

const is_nsfw = ref(false);
const ai_generated = ref(false);

const tags = ref<string[]>([]);
const MAX_TAGS = 6;

const loading = ref(false);

const editMode = ref(false);

function generateTags() {
  const generatedTags = [...tags.value];
  if (is_nsfw.value && !generatedTags.includes("is-nsfw")) generatedTags.push("is-nsfw");
  if (ai_generated.value && !generatedTags.includes("ai-generated")) generatedTags.push("ai-generated");
  return generatedTags.length > 0 ? generatedTags : undefined;
}

function buttonClick() {
  if (editMode.value) editPostButton();
  else createPostButton();
}

function arraysEqualUnordered<T>(arr1: T[], arr2: T[]) {
  if (arr1.length !== arr2.length) return false;
  return arr1
    .slice()
    .sort()
    .every((val, index) => val === arr2.slice().sort()[index]);
}

async function editPostButton() {
  if (!props.originalPost) return;
  loading.value = true;
  const tags = generateTags();
  const content = text.value;
  const data = {
    ...(!arraysEqualUnordered(tags!, props.originalPost.tags!) && { tags }),
    ...(content != props.originalPost.content && { content })
  };
  try {
    if (Object.keys(data).length === 0) {
      quasar.notify({
        type: "error-notification",
        message: t("post_edited.not_changed"),
        progress: true
      });
      return;
    }

    await editPost(props.originalPost.post_id, data);

    // I used ref because I can't change props.originalPost directly.
    const ogPostRef = ref(props.originalPost);
    ogPostRef.value.content = content;
    ogPostRef.value.tags = tags!;

    quasar.notify({
      type: "default-notification",
      message: t("post_edited.msg"),
      caption: t("post_edited.caption"),
      progress: true,
      icon: "sym_r_done_outline"
    });

    dialogRef!.value?.hide();
  } catch {
    quasar.notify({
      type: "error-notification",
      message: t("post_edited.failed"),
      progress: true
    });
  } finally {
    loading.value = false;
  }
}

async function createPostButton() {
  loading.value = true;
  const tags = generateTags();
  const r = await createPost({
    content: text.value!,
    tags: tags!
  });
  loading.value = false;
  if (r.data.success && r.data.data) {
    const post = {
      ...r.data.data,
      user: await profileStore.getProfile()
    };
    quasar.dialog({
      component: PostDialog,
      componentProps: {
        post: post
      }
    });
    quasar.notify({
      type: "default-notification",
      message: t("post_created.msg"),
      caption: t("post_created.caption"),
      progress: true,
      icon: "sym_r_done_outline"
    });

    dialogRef!.value?.hide();
  }
}

const addTag = () => {
  if (addTagValue.value && !tags.value.includes(addTagValue.value)) {
    tags.value.push(addTagValue.value);
    addTagValue.value = "";
  }
};

const removeTag = (index: number) => {
  tags.value.splice(index, 1);
};

onMounted(() => {
  if (props.originalPost) {
    editMode.value = true;

    tags.value = [...props.originalPost.tags];

    const checkAndRemoveTag = (tag: string, ref: Ref<boolean>) => {
      const index = tags.value.indexOf(tag);
      if (index !== -1) {
        ref.value = true;
        tags.value.splice(index, 1);
      }
    };

    checkAndRemoveTag("is-nsfw", is_nsfw);
    checkAndRemoveTag("ai-generated", ai_generated);

    text.value = props.originalPost.content;
  }
});
</script>
