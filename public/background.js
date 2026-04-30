import {
  handleBookmarkAction,
  getRandomBookmark,
  updateBadgeCount,
} from "./background/bookmarks.js";
import { setupAlarm } from "./background/alarms.js";
import {
  showDailyArticleNotification,
  handleNotificationClick,
} from "./background/notifications.js";

chrome.runtime.onInstalled.addListener();
chrome.runtime.onStartup.addListener(updateBadgeCount);

chrome.action.onClicked.addListener(handleBookmarkAction);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_SETTINGS") {
    setupAlarm();
  } else if (message.type === "GET_BADGE_COUNT") {
    updateBadgeCount().then((count) => {
      sendResponse({ count });
    });
    return true;
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "dailyPop") {
    const settings = await chrome.storage.local.get(["isNotifyEnabled"]);
    if (settings.isNotifyEnabled === false) return;

    const item = await getRandomBookmark();
    if (item) {
      showDailyArticleNotification(item);
    } else {
      console.log("PopStack: 積読が空のため通知をスキップしました");
    }
  }
});

chrome.notifications.onClicked.addListener(handleNotificationClick);
