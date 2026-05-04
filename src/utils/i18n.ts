import ja from "../locales/ja";
import en from "../locales/en";

type Locale = "ja" | "en";
type TranslationKeys = keyof typeof ja;

// 現在の言語を取得する関数（Chrome APIが使えればそれを、なければブラウザ言語を取得）
const getCurrentLocale = (): Locale => {
  let lang = "ja";

  if (typeof chrome !== "undefined" && chrome.i18n) {
    lang = chrome.i18n.getUILanguage();
  } else if (typeof navigator !== "undefined") {
    lang = navigator.language;
  }

  return lang.startsWith("ja") ? "ja" : "en";
};

export const t = (key: TranslationKeys): string => {
  const locale = getCurrentLocale();
  const dictionary = locale === "ja" ? ja : en;

  // 辞書にキーが存在しなければキー名をそのまま返す（フォールバック）
  return dictionary[key] || key;
};
