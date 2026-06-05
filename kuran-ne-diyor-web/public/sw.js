self.addEventListener('push', function (event) {
  let data = { title: 'Kuran-ı Kerim Diyor', body: 'Günün ayeti hazır.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Kuran-ı Kerim Diyor', body: event.data.text() };
    }
  }

  const origin = self.location.origin;

  const options = {
    body: data.body,
    icon: origin + '/icons/icon-192x192.png',
    badge: origin + '/icons/icon-192x192.png', // using same icon for badge
    vibrate: [100, 50, 100],
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  // Deep link or navigate to start_url or shared link
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
