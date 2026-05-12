import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  saveToPopStack,
  updateBadgeCount,
  CONFIG,
} from "../public/background/bookmarks.js";

global.chrome = {
  bookmarks: {
    getTree: vi.fn(),
    getChildren: vi.fn(),
    create: vi.fn(),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
  i18n: {
    getMessage: vi.fn(),
  },
};

global.console = {
  ...global.console,
  log: vi.fn(),
  error: vi.fn(),
};

describe("saveToPopStack関数のテスト", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    chrome.bookmarks.getTree.mockResolvedValue([
      {
        children: [
          {
            title: "ブックマーク バー",
            id: "1",
            children: [{ title: "PopStack 📘", id: "99" }],
          },
        ],
      },
    ]);
  });

  it("URLが空の場合は何もせずに終了すること", async () => {
    await saveToPopStack("タイトル", null);
    expect(chrome.bookmarks.create).not.toHaveBeenCalled();
  });

  it("chrome:// から始まるURLの場合は保存しないこと", async () => {
    await saveToPopStack("設定画面", "chrome://settings");
    expect(chrome.bookmarks.create).not.toHaveBeenCalled();
  });

  it("正常なURLが渡された場合、正しくブックマークが生成されること", async () => {
    chrome.bookmarks.getChildren.mockResolvedValue([]);

    await saveToPopStack("テスト記事", "https://example.com");

    expect(chrome.bookmarks.create).toHaveBeenCalledTimes(1);
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: "99",
      title: "テスト記事",
      url: "https://example.com",
    });
  });

  it("タイトルが空の場合は、URL自体をタイトルとして保存すること", async () => {
    chrome.bookmarks.getChildren.mockResolvedValue([]);

    await saveToPopStack("", "https://example.com/notitle");

    expect(chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: "99",
      title: "https://example.com/notitle",
      url: "https://example.com/notitle",
    });
  });

  it("すでに保存されているURLの場合は追加せず、バッジで警告を出すこと", async () => {
    chrome.bookmarks.getChildren.mockResolvedValue([
      { title: "既存の記事", url: "https://example.com/dup" },
    ]);
    chrome.i18n.getMessage.mockReturnValue("済");

    await saveToPopStack("重複記事", "https://example.com/dup");

    expect(chrome.bookmarks.create).not.toHaveBeenCalled();
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: "済" });
    expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
      color: "#f87171",
    });
  });

  it("保存処理中に予期せぬエラーが起きた場合、クラッシュせずにconsole.errorを出力すること", async () => {
    chrome.bookmarks.getTree.mockRejectedValue(new Error("謎の通信エラー"));

    await saveToPopStack("エラー記事", "https://example.com/error");
    expect(console.error).toHaveBeenCalled();
  });
});

describe("updateBadgeCount関数のテスト", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    chrome.bookmarks.getTree.mockResolvedValue([
      {
        children: [
          {
            title: "ブックマーク バー",
            id: "1",
            children: [{ title: "PopStack 📘", id: "99" }],
          },
        ],
      },
    ]);
  });

  it("PopStackフォルダが空の場合、バッジが消えること", async () => {
    chrome.bookmarks.getChildren.mockResolvedValue([]);

    const count = await updateBadgeCount();

    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: "" });
    expect(count).toBe(0);
  });

  it("PopStackフォルダ内のブックマーク数がバッジに正しく反映されること", async () => {
    chrome.bookmarks.getChildren.mockResolvedValue([
      { title: "記事1", url: "https://example.com/1" },
      { title: "記事2", url: "https://example.com/2" },
      { title: "記事3", url: "https://example.com/3" },
    ]);

    const count = await updateBadgeCount();

    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: "3" });
    expect(count).toBe(3);
  });

  it("ブックマーク数が閾値直前まで色が変わらないこと", async () => {
    chrome.bookmarks.getChildren.mockResolvedValue(
      Array.from({ length: CONFIG.BADGE_WARNING_THRESHOLD - 1 }, (_, i) => ({
        title: `記事${i + 1}`,
        url: `https://example.com/${i + 1}`,
      })),
    );
    const count = await updateBadgeCount();

    expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
      color: "#2c3e50",
    });
    expect(count).toBe(CONFIG.BADGE_WARNING_THRESHOLD - 1);
  });

  it("ブックマーク数が閾値に達したときに色が警告色に変わること", async () => {
    chrome.bookmarks.getChildren.mockResolvedValue(
      Array.from({ length: CONFIG.BADGE_WARNING_THRESHOLD }, (_, i) => ({
        title: `記事${i + 1}`,
        url: `https://example.com/${i + 1}`,
      })),
    );
    const count = await updateBadgeCount();

    expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
      color: "#ef4444",
    });
    expect(count).toBe(CONFIG.BADGE_WARNING_THRESHOLD);
  });

  it("ブックマーク数が閾値を遥かに超えたときにも色が警告色のままであること", async () => {
    chrome.bookmarks.getChildren.mockResolvedValue(
      Array.from({ length: CONFIG.BADGE_WARNING_THRESHOLD + 20 }, (_, i) => ({
        title: `記事${i + 1}`,
        url: `https://example.com/${i + 1}`,
      })),
    );
    const count = await updateBadgeCount();

    expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
      color: "#ef4444",
    });
    expect(count).toBe(CONFIG.BADGE_WARNING_THRESHOLD + 20);
  });
});
