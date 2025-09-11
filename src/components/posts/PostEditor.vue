<template>
  <q-dialog
    transition-show="slide-up"
    transition-hide="slide-down"
    class="post-editor-dialog card-dialog"
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
  >
    <closeable-content v-on:hide="dialogRef!.hide()">
      <div class="dialog-header horizontal-container">
        <div class="horizontal-container label-container">
          <my-icon :icon="editMode ? 'edit' : 'article'" class="header-icon" />
          <div class="label">{{ editMode ? $t("edit_post") : $t("create_post") }}</div>
        </div>
        <q-space />
        <my-button icon="close" @click="dialogRef?.hide()" />
      </div>
      <div class="dialog-content-inner">
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
              <my-icon icon="tag" class="icon" />
              <div class="label">{{ $t("tags") }}</div>
            </div>
            <div class="chips" v-if="!editMode">
              <my-chip
                v-for="(tag, index) in ctags"
                :key="index"
                :removable="true"
                @remove="removeTag(index)"
                @click="removeTag(index)"
                :label="tag"
                class="tag"
                icon="tag"
              />
              <my-chip
                :clickable="true"
                icon="add"
                class="tag"
                :disable="ctags.length >= MAX_TAGS"
                :label="$t('add_tag')"
              >
                <q-menu class="menu-card enter-tag-menu field-menu" v-if="ctags.length < MAX_TAGS">
                  <q-input
                    v-model="addTagValue"
                    :label="$t('enter_tag')"
                    @keyup.enter="addTag"
                    borderless
                    class="tag-input full-width"
                    maxlength="22"
                  >
                    <template v-slot:append>
                      <my-button icon="add" class="add-button" @click="addTag" :disable="addTagValue.length == 0" />
                    </template>
                  </q-input>
                </q-menu>
              </my-chip>
            </div>
            <div v-else>
              <div class="hint">{{ $t("cant_change_tags_edit") }}</div>
              <div class="chips">
                <my-chip v-for="(tag, index) in ctags" :key="index" icon="tag" :label="tag" class="tag" />
              </div>
            </div>
          </div>

          <div v-if="!editMode" class="card file-container">
            <div class="horizontal-container">
              <my-icon icon="files" class="icon" />
              <div class="label">{{ $t("files") }}</div>
            </div>
            <div class="files-list container">
              <div class="type-container horizontal-container">
                <my-button
                  :label="$t('image')"
                  :is-category="true"
                  type="card"
                  icon="image"
                  :class="{ selected: currentUploadType == 'post_image' }"
                  @click="changeUploadType('post_image')"
                />
                <my-button
                  :label="$t('video')"
                  :is-category="true"
                  type="card"
                  icon="video_file"
                  :class="{ selected: currentUploadType == 'post_video' }"
                  @click="changeUploadType('post_video')"
                />
              </div>
              <div
                class="drop-area card"
                @dragover.prevent="dragOver = true"
                @dragleave.prevent="dragOver = false"
                @drop.prevent="handleDrop"
                @click="triggerFileInput"
                :class="{ 'drag-over': dragOver, disabled: files.length >= currentUploadConfig.maxCount }"
              >
                <div class="drag-title">{{ $t("drag_drop_title") }}</div>
                <input type="file" ref="fileInput" @change="handleFile" multiple hidden />
              </div>
              <div
                class="card file horizontal-container"
                :class="{ 'is-error': !!file.error }"
                v-for="(file, index) in files"
                :key="index"
              >
                <div class="file-name">
                  {{ (file.error && $t("file_error.error", { error: $t(file.error) })) || file.name }}
                </div>
                <div class="file-size">({{ formatSize(file.size) }})</div>
                <my-button icon="close" @click="removeFileIndex(index)" />
              </div>
            </div>
          </div>

          <q-separator class="separator" />
          <toggle-card label-key="tag.nsfw" icon="explicit" v-model="is_nsfw" />
          <toggle-card label-key="tag.ai" icon="robot_2" v-model="ai_generated" />
        </q-scroll-area>
        <q-separator class="separator q-my-sm" />
        <div class="send-container">
          <my-button
            type="primary"
            :icon-right="editMode ? 'edit' : 'add'"
            :label="editMode ? $t('apply') : $t('create')"
            @click="buttonClick"
            :disable="text.trim().length == 0 || files.some((v) => !!v.error)"
            :loading="loading"
          />
        </div>
      </div>
    </closeable-content>
  </q-dialog>
</template>
<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from "quasar";
import { computed, onMounted, type Ref, ref } from "vue";
import { createPost, editPost } from "src/api/posts";
import { useProfileStore } from "src/stores/profile-store";
import { useI18n } from "vue-i18n";
import ToggleCard from "../misc/ToggleCard.vue";
import MyIcon from "../my/MyIcon.vue";
import MyButton from "../my/MyButton.vue";
import MyChip from "../my/MyChip.vue";
import CloseableContent from "../misc/CloseableContent.vue";
import { useMainStore } from "src/stores/main-store";
import { createContext, uploadFile } from "src/api/storage";
import { storageConfig } from "src/api/storage";

const props = defineProps<{
  originalPost?: Post;
  withCtags?: string[];
}>();

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const quasar = useQuasar();
const profileStore = useProfileStore();
const mainStore = useMainStore();
const { t } = useI18n();

const text = ref<string>("");
const addTagValue = ref<string>("");

const is_nsfw = ref(false);
const ai_generated = ref(false);

const ctags = ref<string[]>(props.withCtags ?? []);
const tags = ref<string[]>([]);
const MAX_TAGS = 4;

const loading = ref(false);

const editMode = ref(false);

const files = ref<
  {
    name: string;
    size: number;
    blob: Blob;
    error?: string | null;
  }[]
>([]);
const dragOver = ref(false);
const fileInput = ref<HTMLInputElement>();
const currentUploadType = ref<CreateContextType>("post_image");
const currentUploadConfig = computed(() => storageConfig[currentUploadType.value]);

function formatSize(size: number) {
  let label = "b";
  if (size > 1024) {
    label = "kb";
    size /= 1024;
  }
  if (size > 1024) {
    label = "mb";
    size /= 1024;
  }
  if (size > 1024) {
    label = "gb";
    size /= 1024;
  }
  return `${Math.round(size)} ${t(`file_size.${label}`)}`;
}

function changeUploadType(type: CreateContextType) {
  currentUploadType.value = type;
  files.value.length = 0;
}

function removeFileIndex(index: number) {
  files.value.splice(index, 1);
}

function triggerFileInput() {
  fileInput.value!.click();
}

function validateFile(file: File) {
  if (file.size > currentUploadConfig.value.maxSize * 1024 * 1024) {
    return "file_error.too_big";
  }
  if (!currentUploadConfig.value.allowedTypes.includes(file.type)) {
    return "file_error.not_allowed_type";
  }
  return null;
}

function addFiles(newFiles: FileList | null) {
  if (!newFiles) return;
  for (const f of newFiles) {
    const error = validateFile(f);
    files.value.push({ name: f.name, size: f.size, blob: f, error });
  }
}

function handleFile(event: Event) {
  if (!event.target) return;
  addFiles((event.target as HTMLInputElement).files);
  (event.target as HTMLInputElement).value = "";
}

function handleDrop(event: DragEvent) {
  dragOver.value = false;
  if (!event.dataTransfer) return;
  addFiles(event.dataTransfer.files);
}

function generateTags() {
  const generatedTags = [...tags.value];
  if (is_nsfw.value && !generatedTags.includes("is-nsfw")) generatedTags.push("is-nsfw");
  if (ai_generated.value && !generatedTags.includes("ai-generated")) generatedTags.push("ai-generated");
  return generatedTags.length > 0 ? generatedTags : undefined;
}

function buttonClick() {
  if (editMode.value) void editPostButton();
  else void createPostButton();
}

function arraysEqualUnordered<T>(arr1: T[], arr2: T[]) {
  if (!arr1 || !arr2) return false;
  if (arr1.length !== arr2.length) return false;
  return arr1
    .slice()
    .sort()
    .every((val, index) => val === arr2.slice().sort()[index]);
}

async function editPostButton() {
  if (!props.originalPost) return;
  loading.value = true;
  const tags = generateTags() ?? [];
  const content = text.value;
  const data = {
    ...(!arraysEqualUnordered(tags, props.originalPost.tags) && { tags }),
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

    dialogRef.value?.hide();
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

  let contextId: string | undefined = undefined;

  try {
    if (files.value.length > 0) {
      const context = await createContext(currentUploadType.value);
      contextId = context.data.data.context_id;
      let index = 0;

      // Uploading file by file without Promises.all to ensure that all files will be in the same order

      for (const file of files.value) {
        if (file.error) continue;
        try {
          // Adding index to filename for case if names are the same
          await uploadFile(`${index}-${file.name}`, file.blob, "context", undefined, contextId);
        } catch (e) {
          file.error = "file_error.failed_to_upload";
          throw e;
        }
        index++;
      }
    }
    const r = await createPost({
      content: text.value,
      ...(contextId && { file_context_id: contextId }),
      tags: tags!,
      ctags: ctags.value
    });
    loading.value = false;
    if (r.data.success && r.data.data) {
      const post = {
        ...r.data.data,
        user: await profileStore.getProfile()
      };
      mainStore.openDialog("post", post.post_id, { post: post });
      quasar.notify({
        type: "default-notification",
        message: t("post_created.msg"),
        caption: t("post_created.caption"),
        progress: true,
        icon: "sym_r_done_outline"
      });

      dialogRef.value?.hide();
    }
  } catch {
    quasar.notify({
      type: "error-notification",
      message: t("post_created.failed"),
      progress: true
    });
  } finally {
    loading.value = false;
  }
}

const addTag = () => {
  if (addTagValue.value && !ctags.value.includes(addTagValue.value)) {
    ctags.value.push(addTagValue.value);
    addTagValue.value = "";
  }
};

const removeTag = (index: number) => {
  ctags.value.splice(index, 1);
};

onMounted(() => {
  if (props.originalPost) {
    editMode.value = true;

    tags.value = [...props.originalPost.tags];
    ctags.value = [...props.originalPost.ctags];

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
