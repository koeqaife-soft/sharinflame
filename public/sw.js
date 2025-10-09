const localization = {
  "en-US": {
    new_comment: "Comment from {username}",
    new_reply: "New reply from {username}",
    mod_deleted_comment: "Your comment was deleted by {username}",
    mod_deleted_post: "Your post was deleted by {username}",
    reason: "Reason"
  }
};

function format(template, params) {
  return template.replace(/{(\w+)}/g, (_, key) => params[key] ?? `{${key}}`);
}

async function askClientsIfAnyHandleable(timeoutMs = 500) {
  const clientsList = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true
  });

  if (clientsList.length === 0) return false;

  const checks = clientsList.map((client) => {
    return new Promise((resolve) => {
      const mc = new MessageChannel();
      const timer = setTimeout(() => {
        mc.port1.onmessage = null;
        resolve(false);
      }, timeoutMs);

      mc.port1.onmessage = (ev) => {
        clearTimeout(timer);
        resolve(Boolean(ev.data && ev.data.canHandle));
      };

      client.postMessage({ type: "SW_PING" }, [mc.port2]);
    });
  });

  const results = await Promise.all(checks);
  return results.some(Boolean);
}

/**
 * @param {PushEvent} event
 */
self.addEventListener("push", (event) => {
  const t = localization["en-US"];

  /** @type {WebPushNotification} */
  const data = event.data?.json() || {};
  console.debug("Got new notification");

  const key = data.is_reply ? "new_reply" : data.type;
  const template = t[key];
  if (!template) {
    console.warn("Unknown notification type: " + data.type);
    return;
  }

  const title = format(template, { username: data.username });

  let message = data.message ?? "";
  if (data.type == "mod_deleted_post" || data.type == "mod_deleted_post") {
    message = `${t.reason}: ${message}`;
  }
  /** @type {NotificationOptions} */
  const options = {
    body: message,
    icon: data.avatar_url ?? "/icons/favicon-96x96.png",
    tag: `notif-${data.id}`,
    vibrate: [100, 50, 100],
    renotify: false
  };

  event.waitUntil(
    (async () => {
      console.debug("Checking for handleable clients");
      const hidePush = await askClientsIfAnyHandleable();
      console.debug("Hide push: " + hidePush);

      if (hidePush) {
        return;
      }

      console.debug("Showing notification");
      await self.registration.showNotification(title, options);
    })()
  );
});

/**
 * @param {NotificationEvent} event
 */
self.addEventListener("notificationclick", (event) => {
  console.debug("Handling notification click");
  event.notification.close();
  const url = event.notification.data ?? "";
  event.waitUntil(self.clients.openWindow(url));
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

/**
 * @param {NotificationEvent} event
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * @param {NotificationEvent} event
 */
self.addEventListener("message", (event) => {
  if (!event.data) return;
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
