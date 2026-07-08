"use client";

import { useState } from "react";
import { RaceResult } from "@/types/karte";

interface MiniCalendarProps {
  karteDates: string[];
  raceDates?: string[];
  raceResults?: RaceResult[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function MiniCalendar({
  karteDates,
  raceDates = [],
  raceResults = [],
  selectedDate,
  onSelectDate,
}: MiniCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const karteSet = new Set(karteDates);
  const raceSet = new Set(raceDates);

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const selectedRaces = selectedDate
    ? raceResults.filter((r) => r.date === selectedDate)
    : [];

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded transition-colors">
          <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-xs font-semibold text-gray-700">
          {viewYear}年{viewMonth + 1}月
        </span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded transition-colors">
          <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 曜日 */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[10px] font-medium py-0.5 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-11" />;
          const dateStr = toDateStr(viewYear, viewMonth, day);
          const hasKarte = karteSet.has(dateStr);
          const hasRace = raceSet.has(dateStr);
          const hasActivity = hasKarte || hasRace;
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr;
          const col = i % 7;

          const textColor = isSelected
            ? "text-white"
            : col === 0
            ? "text-red-400"
            : col === 6
            ? "text-blue-500"
            : hasActivity
            ? "text-gray-700"
            : "text-gray-300";

          return (
            <button
              key={i}
              onClick={() => hasActivity && onSelectDate(isSelected ? null : dateStr)}
              disabled={!hasActivity}
              className={`
                relative flex flex-col items-center pt-1 pb-1 h-11 w-full rounded transition-colors
                ${isSelected ? "bg-blue-600" : ""}
                ${!isSelected && hasActivity ? "hover:bg-blue-50 cursor-pointer" : ""}
                ${!isSelected && !hasActivity ? "cursor-default" : ""}
                ${!isSelected && isToday ? "ring-1 ring-blue-400" : ""}
              `}
            >
              <span className={`text-[11px] font-medium leading-none mb-1 ${textColor}`}>{day}</span>
              <div className="flex flex-col gap-0.5 w-full px-0.5">
                {hasKarte && (
                  <span
                    className={`text-[7px] font-bold text-center px-0.5 py-0.5 rounded leading-none truncate w-full ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    パーソナル
                  </span>
                )}
                {hasRace && (
                  <span
                    className={`text-[7px] font-bold text-center px-0.5 py-0.5 rounded leading-none truncate w-full ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-orange-100 text-orange-500"
                    }`}
                  >
                    大会
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 選択日の大会プレビュー */}
      {selectedRaces.length > 0 && (
        <div className="mt-2 pt-2 border-t border-orange-100 flex flex-col gap-1">
          {selectedRaces.map((r) => (
            <div key={r.id} className="bg-orange-50 rounded-lg px-2 py-1.5 text-[10px] text-orange-800 leading-relaxed">
              <span className="font-bold">{r.competitionName}</span>
              {r.eventName && <span className="text-orange-500"> / {r.eventName}</span>}
              {r.result && <span className="font-bold"> / {r.result}</span>}
            </div>
          ))}
        </div>
      )}

      {selectedDate && (
        <div className="mt-2 text-center border-t border-gray-50 pt-2">
          <button onClick={() => onSelectDate(null)} className="text-[10px] text-blue-500 hover:underline">
            すべて表示に戻る
          </button>
        </div>
      )}
    </div>
  );
}
