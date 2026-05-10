const CONFIG = {
  BADGE_WARNING_THRESHOLD: 30, // 警告色に変わる積読数
  BADGE_ALERT_DURATION_MS: 1500, // 重複時の警告バッジ表示時間(ミリ秒)
};

export async function getPopStackFolder() {
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

export async function updateBadgeCount() {
  const folder = await getPopStackFolder();
  const items = await chrome.bookmarks.getChildren(folder.id);
  const count = items.length;

  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });

    // 一定数以上で警告色（赤）、それ未満はデフォルトの色
    if (count >= CONFIG.BADGE_WARNING_THRESHOLD) {
      chrome.action.setBadgeBackgroundColor({ color: "#ef4444" }); // TailwindのRed-500
    } else {
      chrome.action.setBadgeBackgroundColor({ color: "#2c3e50" });
    }
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
  return count;
}

export async function handleBookmarkAction(tab) {
  if (!tab.url || tab.url.startsWith("chrome://")) return;

  try {
    const folder = await getPopStackFolder();

    const existing = await chrome.bookmarks.getChildren(folder.id);
    const bookmark = existing.find((item) => item.url === tab.url);
    if (bookmark) {
      await chrome.bookmarks.remove(bookmark.id);
      await updateBadgeCount();
      return;
    }

    await chrome.bookmarks.create({
      parentId: folder.id,
      title: tab.title,
      url: tab.url,
    });
    await updateBadgeCount();
  } catch (error) {
    console.error(error);
  }
}

export async function getRandomBookmark() {
  const folder = await getPopStackFolder();
  const items = await chrome.bookmarks.getChildren(folder.id);

  if (items.length > 0) {
    return items[Math.floor(Math.random() * items.length)];
  }
  return null;
}

export async function saveToPopStack(title, url) {
  if (!url || url.startsWith("chrome://")) return;

  try {
    const folder = await getPopStackFolder();

    const existing = await chrome.bookmarks.getChildren(folder.id);
    const isDuplicate = existing.some((item) => item.url === url);

    if (isDuplicate) {
      console.log(
        "PopStack: すでに保存されているURLのためスキップしました",
        url,
      );

      const badgeText = chrome.i18n.getMessage("badgeDuplicate") || "!!";
      chrome.action.setBadgeText({ text: badgeText });
      chrome.action.setBadgeBackgroundColor({ color: "#f87171" }); // Tailwind Red-400

      setTimeout(async () => {
        await updateBadgeCount();
      }, CONFIG.BADGE_ALERT_DURATION_MS);

      return;
    }

    await chrome.bookmarks.create({
      parentId: folder.id,
      title: title || url,
      url: url,
    });
    await updateBadgeCount();
  } catch (error) {
    console.error("PopStack contextmenu error:", error);
  }
}
