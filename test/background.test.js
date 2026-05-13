import { describe, it, expect, vi } from "vitest";

// background.jsが読み込まれる際に各機能が使用するChrome APIを幅広くモック化します
global.chrome = {
  runtime: {
    onInstalled: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
    onStartup: { addListener: vi.fn() },
  },
  bookmarks: {
    onCreated: { addListener: vi.fn() },
    onRemoved: { addListener: vi.fn() },
    getTree: vi.fn(),
    getChildren: vi.fn(),
  },
  alarms: {
    onAlarm: { addListener: vi.fn() },
    create: vi.fn(),
    clearAll: vi.fn(),
  },
  notifications: {
    onClicked: { addListener: vi.fn() },
    onButtonClicked: { addListener: vi.fn() },
    create: vi.fn(),
    clear: vi.fn(),
  },
  omnibox: {
    onInputChanged: { addListener: vi.fn() },
    onInputEntered: { addListener: vi.fn() },
  },
  tabs: {
    update: vi.fn(),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
    onClicked: { addListener: vi.fn() },
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: { addListener: vi.fn() },
  },
  i18n: {
    getMessage: vi.fn().mockReturnValue("mocked message"),
  },
  storage: {
    local: {
      get: vi.fn(),
    },
  },
};

describe("background.js のスモークテスト", () => {
  it("エラーなく正常にインポート(読み込み)できること", async () => {
    // try-catchを使って、インポート時に予期せぬエラーが投げられないか確認します
    let isCrashed = false;
    try {
      await import("../public/background.js");
    } catch (error) {
      console.error("background.js 読み込みエラー:", error);
      isCrashed = true;
    }

    // クラッシュしていなければ（isCrashedがfalseなら）合格
    expect(isCrashed).toBe(false);
  });
});
