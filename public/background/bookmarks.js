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
    chrome.action.setBadgeBackgroundColor({ color: "#2c3e50" });
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
