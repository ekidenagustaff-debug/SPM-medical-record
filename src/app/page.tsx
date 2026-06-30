"use client";

import { useEffect, useState, useCallback } from "react";
import { KarteFormData, KarteRecord } from "@/types/karte";
import KarteForm from "@/components/KarteForm";
import KarteHistory from "@/components/KarteHistory";

export default function Home() {
  const [records, setRecords] = useState<KarteRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await fetch("/api/karte");
      if (!res.ok) throw new Error("取得失敗");
      setRecords(await res.json());
    } catch {
      setHistoryError("カルテの読み込みに失敗しました");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSubmit = async (data: KarteFormData) => {
    const res = await fetch("/api/karte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await fetchRecords();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3 shadow-sm">
        <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">
          S
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-800 leading-tight">
            SPM カルテシステム
          </h1>
          <p className="text-xs text-gray-400">パーソナルトレーニング記録</p>
        </div>
      </header>

      {/* メインコンテンツ：左右分割 */}
      <main className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 65px)" }}>
        {/* 左：新規カルテ入力 */}
        <section className="w-1/2 flex flex-col border-r border-gray-200 bg-white">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-bold text-gray-700">新規カルテ記入</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <KarteForm onSubmit={handleSubmit} />
          </div>
        </section>

        {/* 右：過去カルテ履歴 */}
        <section className="w-1/2 flex flex-col bg-gray-50">
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700">過去のカルテ</h2>
              <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                直近{records.length}件
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">最大10件まで表示</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-full text-gray-300 gap-2">
                <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span className="text-sm">読み込み中...</span>
              </div>
            ) : historyError ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <p className="text-sm text-red-400">{historyError}</p>
                <button onClick={fetchRecords} className="text-xs text-blue-500 underline">再試行</button>
              </div>
            ) : (
              <KarteHistory records={records} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
