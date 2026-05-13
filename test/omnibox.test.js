import { describe, it, expect, vi, beforeEach } from "vitest";

let onInputChangedCallback = null;
let onInputEnteredCallback = null;

global.chrome = {
  omnibox: {
    onInputChanged: {
      addListener: (cb) => {
        onInputChangedCallback = cb;
      },
    },
    onInputEntered: {
      addListener: (cb) => {
        onInputEnteredCallback = cb;
      },
    },
  },
  bookmarks: {
    getTree: vi.fn(),
    getChildren: vi.fn(),
    create: vi.fn(),
  },
  tabs: {
    update: vi.fn(),
  },
};
global.console = { ...global.console, error: vi.fn() };

await import("../public/background/omnibox.js");

describe("Omniboxの検索とサジェスト機能のテスト", () => {
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
    chrome.bookmarks.getChildren.mockResolvedValue([
      { title: "React入門 <基礎編>", url: "https://example.com/react" },
      { title: "Vueの使い方", url: "https://example.com/vue" },
      { title: "TypeScriptの型", url: "https://example.com/ts" },
    ]);
  });

  describe("onInputChanged (入力中のサジェスト生成)", () => {
    it("キーワードを含む記事が正しく抽出され、HTMLエスケープされてsuggestに渡されること", async () => {
      const mockSuggest = vi.fn();

      await onInputChangedCallback("react", mockSuggest);

      expect(mockSuggest).toHaveBeenCalledWith([
        {
          content: "https://example.com/react",
          description: "React入門 &lt;基礎編&gt; - https://example.com/react",
        },
      ]);
    });

    it("エラーが発生した場合、クラッシュせずにconsole.errorを出力すること", async () => {
      chrome.bookmarks.getChildren.mockRejectedValue(new Error("強制エラー"));
      const mockSuggest = vi.fn();

      await onInputChangedCallback("test", mockSuggest);

      expect(console.error).toHaveBeenCalledWith("Omnibox search error");
    });
  });

  describe("onInputEntered (Enterキーでの決定)", () => {
    it("URL形式(http~)が直接渡された場合は、そのURLをそのまま開くこと", async () => {
      await onInputEnteredCallback("https://example.com/direct");

      expect(chrome.tabs.update).toHaveBeenCalledWith({
        url: "https://example.com/direct",
      });
    });

    it("キーワードが渡された場合、一致する最初の記事のURLを開くこと", async () => {
      await onInputEnteredCallback("vue");

      expect(chrome.tabs.update).toHaveBeenCalledWith({
        url: "https://example.com/vue",
      });
    });

    it("キーワードが渡されたが、一致する結果がない場合は何もしない(return)こと", async () => {
      await onInputEnteredCallback("ruby");

      expect(chrome.tabs.update).not.toHaveBeenCalled();
    });
  });
});
