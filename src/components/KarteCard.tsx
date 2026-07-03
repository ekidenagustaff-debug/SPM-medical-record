import { useState } from "react";
import { KarteRecord } from "@/types/karte";

interface KarteCardProps {
  record: KarteRecord;
  index: number;
  onCopyRecord?: (tags: string[], trainingContent: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export default function KarteCard({ record, index, onCopyRecord }: KarteCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyRecord = () => {
    if (!onCopyRecord) return;
    onCopyRecord(record.tags, record.trainingContent ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
            #{index + 1}
          </span>
          <span className="text-xs text-gray-400">
            {formatDate(record.createdAt)} {formatTime(record.createdAt)}
          </span>
        </div>
      </div>

      {/* クライアント / 担当トレーナー */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">クライアント</p>
          <p className="text-sm font-semibold text-gray-800">{record.clientName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">担当トレーナー</p>
          <p className="text-sm font-semibold text-gray-800">{record.trainerName}</p>
        </div>
      </div>

      {/* タグ / トレーニング内容 */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          {record.tags && record.tags.length > 0 ? (
            <>
              <p className="text-xs font-semibold text-gray-500 mb-1">タグ</p>
              <div className="flex flex-wrap gap-1">
                {record.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium border border-blue-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </div>
        <div>
          {record.trainingContent ? (
            <>
              <p className="text-xs font-semibold text-blue-500 mb-0.5">トレーニング内容</p>
              <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-3">
                {record.trainingContent}
              </p>
            </>
          ) : null}
        </div>
      </div>

      {/* コピーボタン */}
      {onCopyRecord && (record.tags.length > 0 || record.trainingContent) && (
        <div className="mt-2">
          <button
            type="button"
            onClick={handleCopyRecord}
            className={`text-[10px] font-semibold px-2 py-1 rounded transition-colors ${
              copied
                ? "bg-green-100 text-green-600"
                : "bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-500"
            }`}
          >
            {copied ? "✓ コピー済" : "タグ・内容をフォームにコピー"}
          </button>
        </div>
      )}

      {/* 主訴 / 総評 */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          {record.chiefComplaint ? (
            <>
              <p className="text-xs font-semibold text-orange-500 mb-0.5">主訴</p>
              <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-2">
                {record.chiefComplaint}
              </p>
            </>
          ) : null}
        </div>
        <div>
          {record.overallAssessment ? (
            <>
              <p className="text-xs font-semibold text-green-500 mb-0.5">総評</p>
              <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-2">
                {record.overallAssessment}
              </p>
            </>
          ) : null}
        </div>
      </div>

      {/* 写真・動画 */}
      {record.mediaUrls && record.mediaUrls.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {record.mediaUrls.map((url, i) => {
            const isVideo = /\.(mp4|mov|webm|avi)(\?|$)/i.test(url);
            return isVideo ? (
              <video
                key={i}
                src={url}
                className="w-20 h-16 object-cover rounded-lg border border-gray-100"
                controls
                preload="metadata"
              />
            ) : (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="w-20 h-16 object-cover rounded-lg border border-gray-100 hover:opacity-90 transition-opacity"
                />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
