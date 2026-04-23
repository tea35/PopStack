async function getPopStackFolder() {
  const bookmarkBar = (await chrome.bookmarks.getTree())[0].children.find(
    (child) => child.title === "ブックマーク バー" || child.id === "1",
  );

  let folder = bookmarkBar.children.find(
    (child) => child.title === "PopStack 📘",
  );
  if (!folder) {
    folder = await chrome.bookmarks.create({
      parentId: bookmarkBar.id,
      title: "PopStack 📘",
    });
  }
  return folder;
}

// アイコンクリック時のイベント
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url || tab.url.startsWith("chrome://")) return;

  try {
    const folder = await getPopStackFolder();

    const existing = await chrome.bookmarks.getChildren(folder.id);
    const bookmark = existing.find((item) => item.url === tab.url);
    if (bookmark) {
      await chrome.bookmarks.remove(bookmark.id);
      chrome.action.setBadgeText({ text: "POP" });
      setTimeout(() => chrome.action.setBadgeText({ text: "" }), 1500);
      return;
    }

    await chrome.bookmarks.create({
      parentId: folder.id,
      title: tab.title,
      url: tab.url,
    });
  } catch (error) {
    console.error(error);
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "UPDATE_SETTINGS") {
    setupAlarm();
  }
});

async function setupAlarm() {
  const { isNotifyEnabled, notifyTime } = await chrome.storage.local.get([
    "isNotifyEnabled",
    "notifyTime",
  ]);

  await chrome.alarms.clear("dailyPop");

  if (isNotifyEnabled && notifyTime) {
    const [hours, minutes] = notifyTime.split(":").map(Number);
    const now = new Date();
    const scheduledTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
    );

    if (scheduledTime <= now)
      scheduledTime.setDate(scheduledTime.getDate() + 1);

    chrome.alarms.create("dailyPop", {
      when: scheduledTime.getTime(),
      periodInMinutes: 1440,
    });
    console.log(`Alarm set for: ${scheduledTime}`);
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "dailyPop") {
    const settings = await chrome.storage.local.get(["isNotifyEnabled"]);
    if (settings.isNotifyEnabled === false) return;

    const folder = await getPopStackFolder();
    const items = await chrome.bookmarks.getChildren(folder.id);

    if (items.length > 0) {
      // 記事がある場合のみ、ランダムに1つ選んで通知
      const randomItem = items[Math.floor(Math.random() * items.length)];

      chrome.notifications.create(randomItem.url, {
        type: "basic",
        iconUrl: "icon.png",
        title: "PopStack: 今日の1記事",
        message: randomItem.title,
        priority: 2,
      });
    } else {
      console.log("PopStack: 積読が空のため通知をスキップしました");
    }
  }
});

chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith("http")) {
    chrome.tabs.create({ url: notificationId });
    chrome.notifications.clear(notificationId);
  }
});
