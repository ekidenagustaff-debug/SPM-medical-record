export interface KarteRecord {
  id: string;
  clientName: string;
  trainerName: string;
  chiefComplaint: string;
  trainingContent: string;
  overallAssessment: string;
  createdAt: string;
}

export type KarteFormData = Omit<KarteRecord, "id" | "createdAt">;
