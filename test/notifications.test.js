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
