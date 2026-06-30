import { KarteRecord } from "@/types/karte";

const STORAGE_KEY = "spm_karte_records";

export function loadRecords(): KarteRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecord(record: KarteRecord): void {
  const records = loadRecords();
  records.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getRecentRecords(limit = 10): KarteRecord[] {
  return loadRecords().slice(0, limit);
}
