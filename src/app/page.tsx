"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayerInfo } from "@/types/karte";

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

const GRADE_ORDER = ["1年", "2年", "3年", "4年"];

export default function PlayerListPage() {
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setPlayers)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const grouped = players.reduce<Record<string, PlayerInfo[]>>((acc, p) => {
    const key = p.grade ?? "その他";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const grades = [
    ...GRADE_ORDER.filter((g) => grouped[g]),
    ...Object.keys(grouped).filter((g) => !GRADE_ORDER.includes(g)),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3 shadow-sm">
        <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">S</div>
        <div>
          <h1 className="text-base font-bold text-gray-800 leading-tight">SPM カルテシステム</h1>
          <p className="text-xs text-gray-400">青山学院陸上部</p>
        </div>
      </header>

      <main className="max-w-lg md:max-w-5xl mx-auto w-full px-4 py-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">選手一覧</h2>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : error ? (
          <p className="text-sm text-red-400 text-center py-8">選手一覧の読み込みに失敗しました</p>
        ) : players.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">選手データが見つかりません</p>
        ) : (
          <div className="flex flex-col gap-6 md:grid md:grid-cols-4 md:gap-4 md:items-start">
            {grades.map((grade) => (
              <div key={grade}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">{grade}</p>
                <div className="flex flex-col gap-2">
                  {grouped[grade].map((player) => (
                    <Link
                      key={player.id}
                      href={`/player/${player.id}`}
                      className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate text-sm">
                          {player.name}
                        </p>
                        {player.gender && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                            player.gender === "男" || player.gender === "男性"
                              ? "bg-blue-500 text-white"
                              : "bg-pink-400 text-white"
                          }`}>
                            {player.gender}
                          </span>
                        )}
                      </div>
                      <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
