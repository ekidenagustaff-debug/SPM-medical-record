"use client";

import { useState } from "react";
import { KarteFormData } from "@/types/karte";

interface KarteFormProps {
  onSubmit: (data: KarteFormData) => void;
}

const EMPTY_FORM: KarteFormData = {
  clientName: "",
  trainerName: "",
  chiefComplaint: "",
  trainingContent: "",
  overallAssessment: "",
};

export default function KarteForm({ onSubmit }: KarteFormProps) {
  const [form, setForm] = useState<KarteFormData>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (submitted) setSubmitted(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim() || !form.trainerName.trim()) return;
    onSubmit(form);
    setForm(EMPTY_FORM);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 h-full">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            クライアント名 <span className="text-red-400">*</span>
          </label>
          <input
            name="clientName"
            value={form.clientName}
            onChange={handleChange}
            required
            placeholder="山田 太郎"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white"
          />
        </div>
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
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          主訴
        </label>
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
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          トレーニング内容
        </label>
        <textarea
          name="trainingContent"
          value={form.trainingContent}
          onChange={handleChange}
          rows={6}
          placeholder="実施したメニュー、セット数、重量、フォームのポイントなど..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white resize-none flex-1"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          総評
        </label>
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
        className="mt-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors text-sm shadow-sm"
      >
        カルテを保存する
      </button>

      {submitted && (
        <p className="text-center text-sm text-green-600 font-medium -mt-2">
          ✓ カルテを保存しました
        </p>
      )}
    </form>
  );
}
