import { KarteRecord } from "@/types/karte";
import KarteCard from "./KarteCard";

interface KarteHistoryProps {
  records: KarteRecord[];
}

export default function KarteHistory({ records }: KarteHistoryProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm">カルテはまだありません</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {records.map((record, index) => (
        <KarteCard key={record.id} record={record} index={index} />
      ))}
    </div>
  );
}
