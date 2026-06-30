"use client";

import { useEffect, useState } from "react";
import { KarteFormData, KarteRecord } from "@/types/karte";
import { saveRecord, getRecentRecords } from "@/lib/storage";
import KarteForm from "@/components/KarteForm";
import KarteHistory from "@/components/KarteHistory";

export default function Home() {
  const [records, setRecords] = useState<KarteRecord[]>([]);

  useEffect(() => {
    setRecords(getRecentRecords(10));
  }, []);

  const handleSubmit = (data: KarteFormData) => {
    const newRecord: KarteRecord = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveRecord(newRecord);
    setRecords(getRecentRecords(10));
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
            <KarteHistory records={records} />
          </div>
        </section>
      </main>
    </div>
  );
}
