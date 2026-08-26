export type Echeance = "J+1" | "J+3" | "J+7";

export interface RevisionPlanItem {
  id: string;
  progressionItemId: string;
  echeance: Echeance;
  dateISO: string;
  questions: { enonce: string; reponse: string }[];
  exercicesApplication: { enonce: string }[];
  createdAtISO: string;
}
