import { defineBoot } from "#q-app/wrappers";
import { computed, type ComputedRef } from "vue";
import { i18n } from "./i18n";

type TagsInfo = Record<string, { name: string; icon: string }>;

declare module "vue" {
  interface ComponentCustomProperties {
    $tagsInfo: ComputedRef<TagsInfo>;
  }
}

export let tagsInfo: ComputedRef<TagsInfo>;

export default defineBoot(({ app }) => {
  const { t } = i18n.global;
  tagsInfo = computed<TagsInfo>(() => ({
    "ai-generated": {
      name: t("tag.ai_name"),
      icon: "sym_r_robot_2"
    },
    "is-nsfw": {
      name: t("tag.nsfw_name"),
      icon: "sym_r_explicit"
    }
  }));

  app.config.globalProperties.$tagsInfo = tagsInfo;
});
