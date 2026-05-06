export function showDailyArticleNotification(item) {
  chrome.notifications.create(item.url, {
    type: "basic",
    iconUrl: "icon.png",
    title: chrome.i18n.getMessage("notificationTitle"),
    message: item.title,
    priority: 2,
    buttons: [{ title: chrome.i18n.getMessage("notificationSkipButton") }],
  });
}

export function handleNotificationClick(notificationId) {
  if (notificationId.startsWith("http")) {
    chrome.tabs.create({ url: notificationId });
    chrome.notifications.clear(notificationId);
  }
}
