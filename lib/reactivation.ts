import type { QuestionFlash, TestReactivation } from "@/types/pedagogie";

const SEANCE_INTERVAL = 10;

/**
 * Prochain multiple de SEANCE_INTERVAL atteint par la progression et pour
 * lequel aucun test de réactivation n'a encore été généré, ou `null` si aucun
 * seuil n'est atteint / tous les seuils atteints ont déjà leur test.
 */
export function nextPendingSeanceMilestone(
  progressionLength: number,
  existingTests: TestReactivation[]
): number | null {
  const generatedSeances = new Set(existingTests.map((t) => t.seance));
  const reachedMilestones = Math.floor(progressionLength / SEANCE_INTERVAL);

  for (let i = 1; i <= reachedMilestones; i++) {
    const seance = i * SEANCE_INTERVAL;
    if (!generatedSeances.has(seance)) return seance;
  }
  return null;
}

/** Échantillon aléatoire sans remise, plafonné à la taille du pool. */
export function pickReactivationQuestions(
  pool: QuestionFlash[],
  count = 8
): QuestionFlash[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = tmp;
  }
  return shuffled.slice(0, count);
}
