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
  tagsInfo = computed<TagsInfo>((oldValue) => {
    const newValue = {
      "ai-generated": {
        name: t("tag.ai.name"),
        icon: "sym_r_robot_2"
      },
      "is-nsfw": {
        name: t("tag.nsfw.name"),
        icon: "sym_r_explicit"
      }
    };

    const isEqual = (obj1: TagsInfo, obj2: TagsInfo): boolean => {
      return JSON.stringify(obj1) === JSON.stringify(obj2);
    };

    if (oldValue && isEqual(oldValue, newValue)) {
      return oldValue;
    }

    return newValue;
  });

  app.config.globalProperties.$tagsInfo = tagsInfo;
});
