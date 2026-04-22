// アイコンクリック時のイベント
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url || tab.url.startsWith("chrome://")) return;

  try {
    // 1. 「ブックマークバー」の中に「PopStack」フォルダがあるか確認
    const bookmarkBar = (await chrome.bookmarks.getTree())[0].children.find(
      (child) => child.title === "ブックマーク バー" || child.id === "1",
    );

    let folder = bookmarkBar.children.find(
      (child) => child.title === "PopStack 📘",
    );

    // 2. なければ作成
    if (!folder) {
      folder = await chrome.bookmarks.create({
        parentId: bookmarkBar.id,
        title: "PopStack 📘",
      });
    }

    // 3. 重複チェック（同じURLがフォルダ内にないか）
    const existing = await chrome.bookmarks.getChildren(folder.id);
    if (existing.some((item) => item.url === tab.url)) {
      showNotification("この記事は既にリストにあります。");
      return;
    }

    // 4. 保存
    await chrome.bookmarks.create({
      parentId: folder.id,
      title: tab.title,
      url: tab.url,
    });
  } catch (error) {
    console.error(error);
  }
});

function showNotification(message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: "PopStack 📘",
    message: message,
    priority: 2,
  });
}
