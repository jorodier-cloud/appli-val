import type { ProgressionItem, QuestionFlash } from "@/types/pedagogie";
import type { Exercice } from "@/types/contenu";
import type { Echeance, RevisionPlanItem } from "@/types/revision";

const OFFSETS: Record<Echeance, number> = { "J+1": 1, "J+3": 3, "J+7": 7 };
const ECHEANCES: Echeance[] = ["J+1", "J+3", "J+7"];
const QUESTIONS_PAR_ECHEANCE = 4;
const EXERCICES_PAR_ECHEANCE = 2;

function addDaysISO(dateISO: string, days: number): string {
  // Tout en UTC (construction ET lecture) : mélanger une construction en heure
  // locale avec une lecture toISOString() (UTC) décale la date d'un jour selon
  // le fuseau du navigateur — piège classique évité ici en restant en UTC de
  // bout en bout.
  const date = new Date(`${dateISO}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function chunk<T>(items: T[], sizePerGroup: number, groupCount: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < groupCount; i++) {
    groups.push(items.slice(i * sizePerGroup, (i + 1) * sizePerGroup));
  }
  return groups;
}

export type RevisionPlanDraft = Omit<RevisionPlanItem, "id" | "createdAtISO">;

/**
 * Construit le planning de révision espacée J+1/J+3/J+7 d'un chapitre en piochant
 * (sans chevauchement entre échéances) dans son propre contenu déjà généré —
 * banque de questions flash (§3.2) et exercices d'application de la fiche
 * d'exercices (§3.5). Pas d'appel IA ici : repli "planning exportable" décidé
 * pour §3.13 en l'absence d'intégration ENT (§3.12).
 */
export function buildRevisionPlan(
  item: ProgressionItem,
  questionsFlash: QuestionFlash[],
  exercicesApplication: Exercice[]
): RevisionPlanDraft[] {
  const questionGroups = chunk(questionsFlash, QUESTIONS_PAR_ECHEANCE, ECHEANCES.length);
  const exerciceGroups = chunk(exercicesApplication, EXERCICES_PAR_ECHEANCE, ECHEANCES.length);

  return ECHEANCES.map((echeance, index) => ({
    progressionItemId: item.id,
    echeance,
    dateISO: addDaysISO(item.dateISO, OFFSETS[echeance]),
    questions: (questionGroups[index] ?? []).map((q) => ({
      enonce: q.enonce,
      reponse: q.reponse,
    })),
    exercicesApplication: (exerciceGroups[index] ?? []).map((e) => ({ enonce: e.enonce })),
  }));
}

export function formatRevisionPlanText(
  chapitreTitre: string,
  plan: Pick<RevisionPlanItem, "echeance" | "dateISO" | "questions" | "exercicesApplication">
): string {
  const lines: string[] = [
    `Révision ${plan.echeance} — ${chapitreTitre} (à faire le ${plan.dateISO})`,
    "",
  ];

  if (plan.questions.length > 0) {
    lines.push("Sans regarder le cours, réponds à :");
    plan.questions.forEach((q, i) => lines.push(`${i + 1}. ${q.enonce}`));
    lines.push("", "Puis vérifie tes réponses avec le cours.", "");
  }

  if (plan.exercicesApplication.length > 0) {
    lines.push("Exercices d'application :");
    plan.exercicesApplication.forEach((e, i) => lines.push(`${i + 1}. ${e.enonce}`));
  }

  return lines.join("\n");
}
