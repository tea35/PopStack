import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveToPopStack } from "../public/background/bookmarks.js";

// === 1. 偽物のChrome APIの準備 ===
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

// console.error や console.log もテスト中にうるさくならないようにモック化
global.console = {
  ...global.console,
  log: vi.fn(),
  error: vi.fn(),
};

describe("saveToPopStack関数のテスト", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // === 2. 「前提条件」のシミュレーション ===
    // getTree (フォルダ構造) が呼ばれたら、PopStackフォルダ(id: "99")が存在するフリをする
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

  // --- すでに実装済みのテスト ---
  it("URLが空の場合は何もせずに終了すること", async () => {
    await saveToPopStack("タイトル", null);
    expect(chrome.bookmarks.create).not.toHaveBeenCalled();
  });

  it("chrome:// から始まるURLの場合は保存しないこと", async () => {
    await saveToPopStack("設定画面", "chrome://settings");
    expect(chrome.bookmarks.create).not.toHaveBeenCalled();
  });

  // --- 追加するテスト ---

  it("正常なURLが渡された場合、正しくブックマークが生成されること", async () => {
    // フォルダの中身（getChildren）は空っぽのフリをする
    chrome.bookmarks.getChildren.mockResolvedValue([]);

    await saveToPopStack("テスト記事", "https://example.com");

    // 検証：createが1回呼ばれ、正しい親ID, タイトル, URLが渡されているか？
    expect(chrome.bookmarks.create).toHaveBeenCalledTimes(1);
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: "99",
      title: "テスト記事",
      url: "https://example.com",
    });
  });

  it("タイトルが空の場合は、URL自体をタイトルとして保存すること", async () => {
    // フォルダの中身（getChildren）は空っぽのフリをする
    chrome.bookmarks.getChildren.mockResolvedValue([]);

    await saveToPopStack("", "https://example.com/notitle");

    // 検証：タイトル部分にURLが入っているか？
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: "99",
      title: "https://example.com/notitle", // タイトルの代わりにURLになっている！
      url: "https://example.com/notitle",
    });
  });

  it("すでに保存されているURLの場合は追加せず、バッジで警告を出すこと", async () => {
    // フォルダの中にすでに同じURLが入っているフリをする
    chrome.bookmarks.getChildren.mockResolvedValue([
      { title: "既存の記事", url: "https://example.com/dup" },
    ]);
    // i18nの翻訳「済」が返ってくるフリをする
    chrome.i18n.getMessage.mockReturnValue("済");

    await saveToPopStack("重複記事", "https://example.com/dup");

    // 検証：新しく作られていないこと
    expect(chrome.bookmarks.create).not.toHaveBeenCalled();
    // 検証：バッジが「済」になり、色が赤っぽくなっていること
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: "済" });
    expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
      color: "#f87171",
    });
  });

  it("保存処理中に予期せぬエラーが起きた場合、クラッシュせずにconsole.errorを出力すること", async () => {
    // getTree時に無理やりエラーを起こすフリをする
    chrome.bookmarks.getTree.mockRejectedValue(new Error("謎の通信エラー"));

    // エラーが起きてもアプリが落ちずに最後まで実行されるか確認
    await saveToPopStack("エラー記事", "https://example.com/error");

    // 検証：console.errorが呼ばれたこと
    expect(console.error).toHaveBeenCalled();
  });
});
