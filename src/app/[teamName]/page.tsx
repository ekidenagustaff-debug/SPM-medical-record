"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", { month: "long", day: "numeric" });
}

export default function PlayerListPage() {
  const params = useParams();
  const teamName = decodeURIComponent(params.teamName as string);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlayer, setNewPlayer] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/teams/${encodeURIComponent(teamName)}/players`)
      .then((r) => r.json())
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, [teamName]);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayer.trim()) return;
    router.push(`/${encodeURIComponent(teamName)}/${encodeURIComponent(newPlayer.trim())}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3 shadow-sm">
        <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">S</div>
        <div>
          <h1 className="text-base font-bold text-gray-800 leading-tight">SPM カルテシステム</h1>
          <p className="text-xs text-gray-400">パーソナルトレーニング記録</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto w-full px-6 py-8">
        {/* パンくず */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
          <Link href="/" className="hover:text-blue-500 transition-colors">チーム一覧</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700 font-medium">{teamName}</span>
        </div>

        <h2 className="text-lg font-bold text-gray-800 mb-5">選手一覧</h2>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            {players.map((player) => (
              <Link
                key={player.name}
                href={`/${encodeURIComponent(teamName)}/${encodeURIComponent(player.name)}`}
                className="bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group"
              >
                <div>
                  <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{player.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {player.karteCount}件
                    {player.lastKarte && ` · 最終: ${formatDate(player.lastKarte)}`}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
            {players.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                このチームに選手はまだいません。下から追加してください。
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleAddPlayer} className="flex gap-2">
          <input
            value={newPlayer}
            onChange={(e) => setNewPlayer(e.target.value)}
            placeholder="新しい選手名を入力..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            進む
          </button>
        </form>
      </main>
    </div>
  );
}
