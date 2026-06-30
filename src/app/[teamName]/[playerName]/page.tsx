"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { KarteFormData, KarteRecord } from "@/types/karte";
import KarteForm from "@/components/KarteForm";
import KarteHistory from "@/components/KarteHistory";
import MiniCalendar from "@/components/MiniCalendar";

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

export default function KarteRecordPage() {
  const params = useParams();
  const teamName = decodeURIComponent(params.teamName as string);
  const playerName = decodeURIComponent(params.playerName as string);

  const [records, setRecords] = useState<KarteRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const karteDates = records.map((r) => r.createdAt.slice(0, 10));

  const fetchRecords = useCallback(async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await fetch(
        `/api/karte?team=${encodeURIComponent(teamName)}&player=${encodeURIComponent(playerName)}`
      );
      if (!res.ok) throw new Error("取得失敗");
      setRecords(await res.json());
    } catch {
      setHistoryError("カルテの読み込みに失敗しました");
    } finally {
      setLoadingHistory(false);
    }
  }, [teamName, playerName]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSubmit = async (data: KarteFormData) => {
    const res = await fetch("/api/karte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("保存失敗");
    await fetchRecords();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3 shadow-sm">
        <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">S</div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
          <Link href="/" className="hover:text-blue-500 transition-colors shrink-0">チーム一覧</Link>
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href={`/${encodeURIComponent(teamName)}`} className="hover:text-blue-500 transition-colors truncate">
            {teamName}
          </Link>
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700 font-semibold truncate">{playerName}</span>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>
        <section className="w-1/2 flex flex-col border-r border-gray-200 bg-white">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-bold text-gray-700">新規カルテ記入</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString("ja-JP", {
                year: "numeric", month: "long", day: "numeric", weekday: "long",
              })}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <KarteForm teamName={teamName} playerName={playerName} onSubmit={handleSubmit} />
          </div>
        </section>

        <section className="w-1/2 flex flex-col bg-gray-50">
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700">過去のカルテ</h2>
              <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                {records.length}件
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {!loadingHistory && !historyError && (
              <MiniCalendar
                karteDates={karteDates}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            )}
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8 gap-2">
                <Spinner />
                <span className="text-sm text-gray-300">読み込み中...</span>
              </div>
            ) : historyError ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <p className="text-sm text-red-400">{historyError}</p>
                <button onClick={fetchRecords} className="text-xs text-blue-500 underline">再試行</button>
              </div>
            ) : (
              <KarteHistory records={records} selectedDate={selectedDate} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
