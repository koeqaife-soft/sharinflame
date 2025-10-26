import { subscribeWebPush } from "src/api/users";

const VAPID = "BJGHEin0mFMzmwplmS-Q4xDjv97OT2AOjSzRa5AcyFpdjPiRwCI0M7yPf8qATGh5VOp4TlMWBuq3DsS5ZQQLw70";

export async function initPush() {
  console.log("Registering push service worker");
  if (!("serviceWorker" in navigator)) {
    console.error("Server worker is not supported");
    return;
  }

  if (!("PushManager" in window)) {
    console.error("Push manager is not supported");
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await registration.update();

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID
      });
    }

    await subscribeWebPush(subscription.toJSON());
  } catch {
    // noop
  }
}
