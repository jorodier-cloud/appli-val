export type NiveauCompetence = "D" | "A" | "PA" | "NA";

export interface Competence {
  id: string;
  evaluationId: string;
  nom: string;
  ordre: number;
}

export interface EvaluationCompetence {
  id: string;
  competenceId: string;
  eleveId: string;
  niveau: NiveauCompetence;
  updatedAtISO: string;
}
