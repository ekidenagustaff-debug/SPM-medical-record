"use client";

import { BloodTestRecord } from "@/types/karte";
import { BLOOD_TEST_CATEGORIES, getReferenceRange } from "@/lib/bloodTestItems";

interface Props {
  record: BloodTestRecord;
  index: number;
  gender?: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function BloodTestCard({ record, index, gender }: Props) {
  return (
    <div
      data-anchor-id={`blood-${record.id}`}
      className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
          #{index + 1}
        </span>
        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
          血液検査
        </span>
        <span className="text-xs text-gray-400">{formatDate(record.testDate)}</span>
      </div>

      <div className="flex flex-col gap-3">
        {BLOOD_TEST_CATEGORIES.map((cat) => {
          const filledItems = cat.items.filter((item) => record.values[item.key] != null);
          if (filledItems.length === 0) return null;
          return (
            <div key={cat.label}>
              <p className="text-[10px] font-bold text-red-500 uppercase mb-1">{cat.label}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {filledItems.map((item) => {
                  const value = record.values[item.key]!;
                  const ref = getReferenceRange(item, gender);
                  const isOutOfRange = ref != null && (value < ref[0] || value > ref[1]);
                  const isLow = ref != null && value < ref[0];
                  return (
                    <div key={item.key} className="flex items-baseline justify-between gap-1 text-xs">
                      <span className="text-gray-500 truncate" title={item.key}>{item.name}</span>
                      <span
                        className={`font-semibold tabular-nums ${
                          isOutOfRange
                            ? isLow
                              ? "text-blue-500"
                              : "text-red-500"
                            : "text-gray-800"
                        }`}
                      >
                        {isOutOfRange && (isLow ? "▼" : "▲")}
                        {value}
                        <span className="text-[9px] font-normal text-gray-400 ml-0.5">{item.unit}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {record.memo && (
        <div className="mt-3 pt-3 border-t border-red-100">
          <span className="text-xs font-semibold text-red-600">メモ</span>
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{record.memo}</p>
        </div>
      )}
    </div>
  );
}
