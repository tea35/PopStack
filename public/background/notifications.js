export function showDailyArticleNotification(item) {
  chrome.notifications.create(item.url, {
    type: "basic",
    iconUrl: "icon.png",
    title: "PopStack: 今日の1記事",
    message: item.title,
    priority: 2,
  });
}

export function handleNotificationClick(notificationId) {
  if (notificationId.startsWith("http")) {
    chrome.tabs.create({ url: notificationId });
    chrome.notifications.clear(notificationId);
  }
}
