import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  showDailyArticleNotification,
  handleNotificationClick,
} from "../public/background/notifications.js";

global.chrome = {
  notifications: {
    create: vi.fn(),
    clear: vi.fn(),
  },
  tabs: {
    create: vi.fn(),
  },
  i18n: {
    getMessage: vi.fn((key) => {
      if (key === "notificationTitle") return "テスト通知タイトル";
      if (key === "notificationSkipButton") return "別の記事にする";
      return key;
    }),
  },
};

describe("showDailyArticleNotification関数のテスト", () => {
  beforeEach(() => vi.clearAllMocks());

  it("渡されたブックマーク情報を用いて、正しく通知が生成されること", () => {
    const mockItem = {
      title: "テスト駆動開発入門",
      url: "https://example.com/tdd",
    };

    showDailyArticleNotification(mockItem);

    expect(chrome.notifications.create).toHaveBeenCalledWith(
      "https://example.com/tdd",
      {
        type: "basic",
        iconUrl: "icon.png",
        title: "テスト通知タイトル",
        message: "テスト駆動開発入門",
        priority: 2,
        buttons: [{ title: "別の記事にする" }],
      },
    );
  });
});

describe("handleNotificationClick関数のテスト", () => {
  beforeEach(() => vi.clearAllMocks());

  it("通知IDがhttpから始まる場合、新しいタブを開いて通知をクリアすること", () => {
    const notificationId = "https://example.com/article";

    handleNotificationClick(notificationId);

    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: "https://example.com/article",
    });
    expect(chrome.notifications.clear).toHaveBeenCalledWith(
      "https://example.com/article",
    );
  });

  it("通知IDがhttpから始まらない場合（システム通知等）、何もしないこと", () => {
    const notificationId = "some-system-message-id";

    handleNotificationClick(notificationId);

    expect(chrome.tabs.create).not.toHaveBeenCalled();
    expect(chrome.notifications.clear).not.toHaveBeenCalled();
  });
});
