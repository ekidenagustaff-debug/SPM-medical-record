export interface KarteRecord {
  id: string;
  teamName: string;
  clientName: string;
  trainerName: string;
  chiefComplaint: string;
  trainingContent: string;
  overallAssessment: string;
  createdAt: string;
}

export type KarteFormData = Omit<KarteRecord, "id" | "createdAt">;

export interface TeamInfo {
  name: string;
  playerCount: number;
}

export interface PlayerInfo {
  name: string;
  karteCount: number;
  lastKarte: string | null;
}
