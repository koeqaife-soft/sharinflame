<template>
  <div class="notifications">
    <div class="notifications-container">
      <div v-if="loading" class="loading container">
        <rect-skeleton v-for="i in 5" :key="i" class="notification-skeleton" height="60px" />
      </div>
      <template v-else>
        <div v-if="!loading && notifications.length === 0" class="no-notifications">
          {{ $t("notifications.no_notifications") }}
        </div>
        <transition-group name="notification" tag="div" class="container">
          <notification-card v-for="notif in notifications" :key="notif.id" :notif="notif" />
        </transition-group>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref, watch } from "vue";
import { useMainStore } from "src/stores/main-store";
import { getNotifications } from "src/api/users";

const mainStore = useMainStore();

const NotificationCard = defineAsyncComponent(() => import("./NotificationCard.vue"));
const RectSkeleton = defineAsyncComponent(() => import("src/components/skeletons/RectSkeleton.vue"));

const notifications = ref<ApiNotification[]>([]);
const loading = ref(true);

watch(
  mainStore.lastNotifications,
  (newVal) => {
    notifications.value = newVal.slice();
    if (newVal.length > 0) {
      loading.value = false;
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (mainStore.lastNotifications.length === 0) {
    void getNotifications(undefined, 5).then((response) => {
      if (response.data.success) {
        response.data.data.notifications.reverse().forEach((notif) => {
          mainStore.addNotification(notif);
        });
      }
      loading.value = false;
    });
  }
});
</script>

<style scoped lang="scss">
.notification-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.notification-enter-active {
  transition: all 0.3s ease;
}

.notification-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.notification-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-leave-to {
  opacity: 0;
}

.notification-move {
  transition: all 0.3s ease;
}
</style>
