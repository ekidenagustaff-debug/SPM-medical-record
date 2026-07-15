"use client";

import { MedicalKarteRecord } from "@/types/karte";

interface Props {
  record: MedicalKarteRecord;
  index: number;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function MedicalKarteCard({ record, index }: Props) {
  return (
    <div
      data-anchor-id={`medical-${record.id}`}
      className="bg-green-50 border border-green-100 rounded-xl p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
          #{index + 1}
        </span>
        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
          メディカル
        </span>
        <span className="text-xs text-gray-400">{formatDate(record.createdAt)}</span>
        {record.trainerName && (
          <span className="text-xs text-gray-500 ml-auto">{record.trainerName}</span>
        )}
      </div>

      <div className="flex flex-col gap-2 text-sm">
        {record.chiefComplaint && (
          <div>
            <span className="text-xs font-semibold text-green-700">主訴</span>
            <p className="text-gray-700 mt-0.5 leading-relaxed">{record.chiefComplaint}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {record.treatmentRange && (
            <div>
              <span className="text-xs font-semibold text-green-700">治療範囲</span>
              <p className="text-gray-700 mt-0.5">{record.treatmentRange}</p>
            </div>
          )}
          {record.acupuncturePresence && (
            <div>
              <span className="text-xs font-semibold text-green-700">針治療</span>
              <p className="text-gray-700 mt-0.5">
                {record.acupuncturePresence}
                {record.acupuncturePresence === "あり" && record.acupunctureLocation && (
                  <span className="text-gray-500 ml-1">（{record.acupunctureLocation}）</span>
                )}
              </p>
            </div>
          )}
        </div>

        {record.overallAssessment && (
          <div className="border-t border-green-100 pt-2">
            <span className="text-xs font-semibold text-green-700">総評</span>
            <p className="text-gray-700 mt-0.5 leading-relaxed">{record.overallAssessment}</p>
          </div>
        )}
      </div>
    </div>
  );
}
