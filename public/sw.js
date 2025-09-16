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
  console.debug("Got new notification");

  const key = data.is_reply ? "new_reply" : data.type;
  const template = t[key] ?? t.new_notification;

  const title = format(template, { username: data.username });

  /** @type {NotificationOptions} */
  const options = {
    body: decodeHTMLEntities(data.message) ?? "",
    icon: data.avatar_url ?? "/icons/favicon-96x96.png",
    tag: `notif-${data.id}`,
    vibrate: [100, 50, 100]
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
  const url = event.notification.data;
  event.waitUntil(self.clients.openWindow(url));
});
