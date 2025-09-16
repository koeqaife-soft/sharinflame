const localization = {
  "en-US": {
    new_comment: "Comment from {username}",
    new_reply: "New reply from {username}",
    new_notification: "New Notification"
  }
};

function format(template, params) {
  return template.replace(/{(\w+)}/g, (_, key) => params[key] ?? `{${key}}`);
}

function decodeHTMLEntities(str) {
  const txt = new DOMParser().parseFromString(str, "text/html");
  return txt.documentElement.textContent;
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

  const key = data.is_reply ? "new_reply" : data.type;
  const template = t[key] ?? t.new_notification;

  const title = format(template, { username: data.username });

  /** @type {NotificationOptions} */
  const options = {
    body: decodeHTMLEntities(data.message) ?? "",
    icon: data.avatar_url ?? "/icons/favicon-96x96.png"
  };

  event.waitUntil(
    (async () => {
      const hidePush = await askClientsIfAnyHandleable();

      if (hidePush) {
        return;
      }

      await self.registration.showNotification(title, options);
    })()
  );
});

/**
 * @param {NotificationEvent} event
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data;
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
