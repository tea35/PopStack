import {
  handleBookmarkAction,
  getRandomBookmark,
  updateBadgeCount,
  saveToPopStack,
} from "./background/bookmarks.js";
import { setupAlarm } from "./background/alarms.js";
import {
  showDailyArticleNotification,
  handleNotificationClick,
} from "./background/notifications.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "popstack-save-link",
    title: "Save to PopStack",
    contexts: ["link"],
  });
  chrome.contextMenus.create({
    id: "popstack-save-page",
    title: "Save to PopStack",
    contexts: ["page"],
  });
});
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

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "popstack-save-link") {
    saveToPopStack(info.linkText || info.linkUrl, info.linkUrl);
  } else if (info.menuItemId === "popstack-save-page") {
    if (tab && tab.url) {
      saveToPopStack(tab.title || "Untitled", tab.url);
    }
  }
});
