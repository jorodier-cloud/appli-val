import type { CopyCorrectionResult } from "@/types/evaluation";

export interface Classe {
  id: string;
  nom: string;
  niveauId: string | null;
}

export interface Eleve {
  id: string;
  classeId: string;
  prenom: string;
  nom: string;
}

export interface Evaluation {
  id: string;
  classeId: string;
  titre: string;
  bareme: string;
  dateISO: string;
  maxTotalScore: number | null;
}

export type NoteSource = "ia" | "manuel";

export interface Note {
  id: string;
  evaluationId: string;
  eleveId: string;
  totalScore: number;
  maxTotalScore: number;
  source: NoteSource;
  correction: CopyCorrectionResult | null;
  detectedStudentName: string | null;
  commentaire: string;
  updatedAtISO: string;
}
