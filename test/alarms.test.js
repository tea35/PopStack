import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupAlarm } from "../public/background/alarms.js";

// モックの準備
global.chrome = {
  storage: {
    local: {
      get: vi.fn(),
    },
  },
  alarms: {
    clear: vi.fn(),
    create: vi.fn(),
  },
};

global.console = {
  ...global.console,
  log: vi.fn(),
};

describe("setupAlarm関数のテスト", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date(2026, 4, 10, 12, 0, 0));
  });

  it("通知が無効、または時間が未設定の場合はアラームをクリアするのみであること", async () => {
    chrome.storage.local.get.mockResolvedValue({
      isNotifyEnabled: false,
      notifyTime: "15:00",
    });

    await setupAlarm();

    expect(chrome.alarms.clear).toHaveBeenCalledWith("dailyPop");
    expect(chrome.alarms.create).not.toHaveBeenCalled();
  });

  it("現在時刻より『未来』の時間が設定された場合、今日のその時間にアラームがセットされること", async () => {
    chrome.storage.local.get.mockResolvedValue({
      isNotifyEnabled: true,
      notifyTime: "15:00",
    });

    await setupAlarm();

    const expectedTime = new Date(2026, 4, 10, 15, 0, 0).getTime();

    expect(chrome.alarms.create).toHaveBeenCalledWith("dailyPop", {
      when: expectedTime,
      periodInMinutes: 1440,
    });
  });

  it("現在時刻より『過去』の時間が設定された場合、明日のその時間にアラームがセットされること", async () => {
    chrome.storage.local.get.mockResolvedValue({
      isNotifyEnabled: true,
      notifyTime: "09:00",
    });

    await setupAlarm();

    const expectedTime = new Date(2026, 4, 11, 9, 0, 0).getTime();

    expect(chrome.alarms.create).toHaveBeenCalledWith("dailyPop", {
      when: expectedTime,
      periodInMinutes: 1440,
    });
  });
});
