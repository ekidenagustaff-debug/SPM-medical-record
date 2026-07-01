"use client";

import { useState, useEffect, useRef } from "react";
import { KarteFormData } from "@/types/karte";

interface KarteFormProps {
  playerId: string;
  playerName: string;
  initialTags?: string[];
  onSubmit: (data: KarteFormData) => Promise<void>;
}

type MediaItem = {
  id: string;
  preview: string;
  isVideo: boolean;
  url?: string;
  uploading: boolean;
  error?: boolean;
};

const VIDEO_EXTS = ["mp4", "mov", "webm", "avi"];

function isVideoFile(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return file.type.startsWith("video/") || VIDEO_EXTS.includes(ext);
}

const EMPTY = { trainerName: "", chiefComplaint: "", trainingContent: "", overallAssessment: "" };

export default function KarteForm({ playerId, playerName, initialTags, onSubmit }: KarteFormProps) {
  const [form, setForm] = useState(EMPTY);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [trainerOptions, setTrainerOptions] = useState<string[]>([]);
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/trainers").then((r) => r.json()).then(setTrainerOptions).catch(() => {});
    fetch("/api/tags").then((r) => r.json()).then(setTagOptions).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialTags && initialTags.length > 0) {
      setSelectedTags(initialTags);
    }
  }, [initialTags]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    const newItems: MediaItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      preview: URL.createObjectURL(file),
      isVideo: isVideoFile(file),
      uploading: true,
    }));

    setMediaItems((prev) => [...prev, ...newItems]);

    await Promise.all(
      newItems.map(async (item, i) => {
        try {
          const fd = new FormData();
          fd.append("file", files[i]);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          if (!res.ok) throw new Error("upload failed");
          const { url } = await res.json();
          setMediaItems((prev) =>
            prev.map((m) => (m.id === item.id ? { ...m, url, uploading: false } : m))
          );
        } catch {
          setMediaItems((prev) =>
            prev.map((m) => (m.id === item.id ? { ...m, uploading: false, error: true } : m))
          );
        }
      })
    );
  };

  const removeMedia = (id: string) => {
    setMediaItems((prev) => {
      const item = prev.find((m) => m.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((m) => m.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.trainerName.trim()) return;
    if (mediaItems.some((m) => m.uploading)) {
      setError("アップロード中のファイルがあります。完了をお待ちください。");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        playerId,
        clientName: playerName,
        ...form,
        tags: selectedTags,
        mediaUrls: mediaItems.filter((m) => m.url && !m.error).map((m) => m.url!),
      });
      setForm(EMPTY);
      setSelectedTags([]);
      setMediaItems([]);
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
      {/* 担当トレーナー名 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          担当トレーナー名 <span className="text-red-400">*</span>
        </label>
        <select
          name="trainerName"
          value={form.trainerName}
          onChange={handleChange}
          required
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white text-gray-800"
        >
          <option value="">トレーナーを選択...</option>
          {trainerOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* タグ */}
      {tagOptions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">タグ</label>
          <div className="flex flex-wrap gap-1.5">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-blue-600 text-white border-blue-600 font-medium"
                    : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-500"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 主訴 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">主訴</label>
        <textarea
          name="chiefComplaint"
          value={form.chiefComplaint}
          onChange={handleChange}
          rows={2}
          placeholder="今日の体調や気になる箇所、目標など..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white resize-none"
        />
      </div>

      {/* トレーニング内容 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          トレーニング内容
        </label>
        <textarea
          name="trainingContent"
          value={form.trainingContent}
          onChange={handleChange}
          rows={5}
          placeholder="実施したメニュー、セット数、重量、フォームのポイントなど..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white resize-none"
        />
      </div>

      {/* 総評 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">総評</label>
        <textarea
          name="overallAssessment"
          value={form.overallAssessment}
          onChange={handleChange}
          rows={3}
          placeholder="今日のセッション全体の評価、次回へのメモなど..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white resize-none"
        />
      </div>

      {/* メディア */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          写真・動画
        </label>

        {mediaItems.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mediaItems.map((item) => (
              <div key={item.id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                {item.isVideo ? (
                  <video src={item.preview} className="w-full h-full object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.preview} alt="" className="w-full h-full object-cover" />
                )}
                {item.uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                )}
                {item.error && (
                  <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">失敗</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(item.id)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {item.isVideo && !item.uploading && (
                  <div className="absolute bottom-0.5 left-0.5 bg-black/50 rounded px-1">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 flex items-center justify-center text-gray-300 hover:text-blue-400 transition-colors shrink-0"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        )}

        {mediaItems.length === 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-lg py-4 flex flex-col items-center gap-1.5 text-gray-400 hover:text-blue-400 transition-colors"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">写真・動画を追加</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm shadow-sm flex items-center justify-center gap-2"
      >
        {saving && (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {saving ? "保存中..." : "カルテを保存する"}
      </button>

      {submitted && (
        <p className="text-center text-sm text-green-600 font-medium -mt-2">✓ Notionに保存しました</p>
      )}
      {error && (
        <p className="text-center text-sm text-red-500 font-medium -mt-2">{error}</p>
      )}
    </form>
  );
}
