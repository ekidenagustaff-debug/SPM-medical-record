"use client";

import { useState } from "react";
import { KarteFormData } from "@/types/karte";

interface KarteFormProps {
  teamName: string;
  playerName: string;
  onSubmit: (data: KarteFormData) => Promise<void>;
}

const EMPTY = { trainerName: "", chiefComplaint: "", trainingContent: "", overallAssessment: "" };

export default function KarteForm({ teamName, playerName, onSubmit }: KarteFormProps) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.trainerName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ teamName, clientName: playerName, ...form });
      setForm(EMPTY);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setError("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 h-full">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          担当トレーナー名 <span className="text-red-400">*</span>
        </label>
        <input
          name="trainerName"
          value={form.trainerName}
          onChange={handleChange}
          required
          placeholder="鈴木 一郎"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">主訴</label>
        <textarea
          name="chiefComplaint"
          value={form.chiefComplaint}
          onChange={handleChange}
          rows={3}
          placeholder="今日の体調や気になる箇所、目標など..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white resize-none"
        />
      </div>

      <div className="flex flex-col gap-1 flex-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">トレーニング内容</label>
        <textarea
          name="trainingContent"
          value={form.trainingContent}
          onChange={handleChange}
          rows={7}
          placeholder="実施したメニュー、セット数、重量、フォームのポイントなど..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white resize-none flex-1"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">総評</label>
        <textarea
          name="overallAssessment"
          value={form.overallAssessment}
          onChange={handleChange}
          rows={4}
          placeholder="今日のセッション全体の評価、次回へのメモなど..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm shadow-sm flex items-center justify-center gap-2"
      >
        {saving && (
          <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {saving ? "保存中..." : "カルテを保存する"}
      </button>

      {submitted && <p className="text-center text-sm text-green-600 font-medium -mt-2">✓ Notionに保存しました</p>}
      {error && <p className="text-center text-sm text-red-500 font-medium -mt-2">{error}</p>}
    </form>
  );
}
