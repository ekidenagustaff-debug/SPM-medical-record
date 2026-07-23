export interface KarteRecord {
  id: string;
  playerId?: string;
  clientName: string;
  trainerName: string;
  location: string;
  chiefComplaint: string;
  physicalCheck: string;
  procedureContent: string;
  trainingContent: string;
  memo: string;
  tags: string[];
  mediaUrls: string[];
  createdAt: string;
}

export interface KarteFormData {
  playerId: string;
  clientName: string;
  trainerName: string;
  location: string;
  chiefComplaint: string;
  physicalCheck: string;
  procedureContent: string;
  trainingContent: string;
  memo: string;
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
  date: string;
  result: string;
  rank?: number;
  flags: string[];
  venue: string;
  notes: string;
  category: string;
}

export interface MedicalKarteRecord {
  id: string;
  playerId?: string;
  clientName: string;
  trainerName: string;
  chiefComplaint: string;
  acupuncturePresent: string;
  acupunctureLocation: string;
  treatmentScope: string;
  overallAssessment: string;
  createdAt: string;
}

export interface BloodTestRecord {
  id: string;
  playerId?: string;
  clientName: string;
  testDate: string;
  memo: string;
  values: Record<string, number | null>;
  createdAt: string;
}

export interface PlayerProfile {
  id: string;
  playerId?: string;
  clientName: string;
  existingConditions: string;
  medications: string;
  updatedAt: string;
}

export interface PlayerProfileFormData {
  playerId: string;
  clientName: string;
  existingConditions: string;
  medications: string;
}
