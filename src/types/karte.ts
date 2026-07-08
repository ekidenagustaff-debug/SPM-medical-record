export interface KarteRecord {
  id: string;
  playerId?: string;
  clientName: string;
  trainerName: string;
  chiefComplaint: string;
  trainingContent: string;
  overallAssessment: string;
  tags: string[];
  mediaUrls: string[];
  createdAt: string;
}

export interface KarteFormData {
  playerId: string;
  clientName: string;
  trainerName: string;
  chiefComplaint: string;
  trainingContent: string;
  overallAssessment: string;
  tags: string[];
  mediaUrls: string[];
}

export interface PlayerInfo {
  id: string;
  name: string;
  grade?: string;
  gender?: string;
  karteCount?: number;
  lastKarte?: string | null;
}

export interface TeamInfo {
  name: string;
  playerCount: number;
}

export interface RaceResult {
  id: string;
  competitionName: string;
  eventName: string;
  date: string; // "YYYY-MM-DD"
  result: string;
  rank?: number;
  flags: string[];
  venue: string;
  notes: string;
  category: string;
}
