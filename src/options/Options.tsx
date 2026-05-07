import { useState, useEffect } from "react";
import { t } from "../utils/i18n";

export default function Options() {
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("09:00");
  const [status, setStatus] = useState("");
  const [stackCount, setStackCount] = useState<number | null>(null);

  useEffect(() => {
    chrome.storage.local.get(
      ["isNotifyEnabled", "notifyTime"],
      (res: { isNotifyEnabled?: boolean; notifyTime?: string }) => {
        setEnabled(res.isNotifyEnabled ?? false);
        setTime(res.notifyTime ?? "09:00");
      },
    );
    chrome.runtime.sendMessage({ type: "GET_BADGE_COUNT" }, (response) => {
      if (response && typeof response.count === "number") {
        setStackCount(response.count);
      }
    });
  }, []);

  const saveSettings = () => {
    chrome.storage.local.set(
      {
        isNotifyEnabled: enabled,
        notifyTime: time,
      },
      () => {
        setStatus(t("saveSuccess"));
        chrome.runtime.sendMessage({ type: "UPDATE_SETTINGS" });
        setTimeout(() => setStatus(""), 2000);
      },
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] dark:bg-gray-900 text-[#2c3e50] dark:text-gray-100 font-sans flex flex-col transition-colors duration-300">
      {/* ─── ヘッダー ─── */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden p-1 shadow-sm border border-gray-100 dark:border-gray-600 transition-colors">
              <img
                src="icon.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-gray-800 dark:text-white">
              PopStack
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-12 lg:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
              {t("optionsTitle")}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 transition-colors">
              {t("optionsDesc")}
            </p>
          </div>

          {stackCount !== null && (
            <div className="bg-white dark:bg-gray-800 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 mb-6 transition-colors duration-300">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {t("currentStackLabel")}
                </span>
              </div>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 transition-colors">
                {stackCount}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
            {/* セクション1：通知 */}
            <div className="p-8 md:p-10 border-b border-gray-100 dark:border-gray-700 transition-colors duration-300">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {t("dailyNotifyTitle")}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("dailyNotifyDesc")}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 transition-colors duration-300"></div>
                </label>
              </div>

              <div
                className={`mt-8 pt-8 border-t border-gray-50 dark:border-gray-700/50 transition-all duration-300 ${enabled ? "opacity-100" : "opacity-20 pointer-events-none"}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10">
                  <div className="sm:w-1/3">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {t("notifyTimeTitle")}
                    </h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {t("notifyTimeDesc")}
                    </p>
                  </div>
                  <div className="flex-1">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full max-w-[200px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 font-mono text-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 outline-none transition-all dark:[color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50/50 dark:bg-gray-900/30 p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-300">
              <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-gray-500 font-medium">
                {status && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-left-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {status}
                  </span>
                )}
              </div>
              <button
                onClick={saveSettings}
                className="w-full sm:w-auto bg-[#2c3e50] dark:bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 dark:hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-gray-200 dark:shadow-none"
              >
                {t("saveButton")}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
