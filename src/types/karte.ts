export interface KarteRecord {
  id: string;
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
