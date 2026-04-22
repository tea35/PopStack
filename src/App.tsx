import { useState, useEffect } from "react";

interface Article {
  title: string;
  url: string;
  addedAt: number;
}

function App() {
  const [stack, setStack] = useState<Article[]>([]);

  // 1. データ読み込み
  useEffect(() => {
    chrome.storage.local.get(
      ["popStack"],
      (result: { popStack?: Article[] }) => {
        if (Array.isArray(result.popStack)) setStack(result.popStack);
      }
    );
  }, []);

  // 2. 現在のタブを保存
  const pushToStack = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab.url && tab.title) {
      // 重複チェック
      if (stack.some((item) => item.url === tab.url)) {
        alert("既にStackされています！");
        return;
      }

      const newArticle: Article = {
        title: tab.title,
        url: tab.url,
        addedAt: Date.now(),
      };

      const newStack = [newArticle, ...stack];
      setStack(newStack);
      await chrome.storage.local.set({ popStack: newStack });
    }
  };

  // 3. 読み終わった記事を削除 (Pop)
  const popFromStack = async (url: string) => {
    const newStack = stack.filter((item) => item.url !== url);
    setStack(newStack);
    await chrome.storage.local.set({ popStack: newStack });
  };

  return (
    <div className="w-80 p-4 bg-white min-h-[300px]">
      <h1 className="text-xl font-bold mb-4 flex items-center">
        🚀 PopStack{" "}
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({stack.length})
        </span>
      </h1>

      <button
        onClick={pushToStack}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 mb-4 transition"
      >
        今の記事をStackする
      </button>

      <div className="space-y-2">
        {stack.map((item) => (
          <div
            key={item.url}
            className="border-b pb-2 flex justify-between items-start group"
          >
            <a
              href={item.url}
              target="_blank"
              className="text-sm text-blue-500 hover:underline line-clamp-2 pr-2"
            >
              {item.title}
            </a>
            <button
              onClick={() => popFromStack(item.url)}
              className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-red-100 hover:text-red-600"
            >
              Done
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
