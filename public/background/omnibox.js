import { getPopStackFolder } from "./bookmarks.js";

chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  try {
    const folder = await getPopStackFolder();
    const items = await chrome.bookmarks.getChildren(folder.id);

    const matched = items.filter(
      (item) =>
        item.title.toLowerCase().includes(text.toLowerCase()) ||
        item.url.toLowerCase().includes(text.toLowerCase()),
    );

    const suggestions = matched.map((item) => {
      const safeTitle = item.title
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return {
        content: item.url,
        description: `${safeTitle} - ${item.url}`,
      };
    });

    suggest(suggestions);
  } catch (error) {
    console.error("Omnibox search error");
  }
});

chrome.omnibox.onInputEntered.addListener(async (text) => {
  let targetUrl = text;
  if (!text.startsWith("http")) {
    const folder = await getPopStackFolder();
    const items = await chrome.bookmarks.getChildren(folder.id);
    const query = text.toLowerCase();
    const matched = items.find(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.url.toLowerCase().includes(query),
    );
    if (matched) {
      targetUrl = matched.url;
    } else {
      return;
    }
  }

  chrome.tabs.update({ url: targetUrl });
});
