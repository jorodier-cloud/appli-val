import type { NiveauCompetence, EvaluationCompetence } from "@/types/competences";

export const NIVEAU_COMPETENCE_ORDER: NiveauCompetence[] = ["NA", "PA", "A", "D"];

const CYCLE: NiveauCompetence[] = ["D", "A", "PA", "NA"];

export function nextNiveauCompetence(current: NiveauCompetence): NiveauCompetence {
  const index = CYCLE.indexOf(current);
  return CYCLE[(index + 1) % CYCLE.length]!;
}

/** Taux (0-100) de compétences au niveau D ou A ("acquises") sur l'ensemble transmis. */
export function tauxAcquisition(evaluationCompetences: EvaluationCompetence[]): number | null {
  if (evaluationCompetences.length === 0) return null;
  const acquises = evaluationCompetences.filter(
    (ec) => ec.niveau === "D" || ec.niveau === "A"
  ).length;
  return (acquises / evaluationCompetences.length) * 100;
}
