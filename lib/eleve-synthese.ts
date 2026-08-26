import type { Eleve, Evaluation, Note } from "@/types/domain";

export type Tendance = "hausse" | "stable" | "baisse" | null;

export interface EleveSynthese {
  eleveId: string;
  moyenne: number | null; // sur 20
  tendance: Tendance;
  alerte: boolean;
  nombreNotes: number;
}

/**
 * Synthèse par élève (moyenne, tendance, alerte) à partir des notes existantes
 * d'une classe — calcul déterministe, pas de génération IA (§3.11 ne le demande
 * pas pour ce point).
 */
export function computeElevesSynthese(
  eleves: Eleve[],
  evaluations: Evaluation[],
  notes: Note[]
): EleveSynthese[] {
  const dateByEvaluationId = new Map(evaluations.map((e) => [e.id, e.dateISO]));

  return eleves.map((eleve) => {
    const eleveNotes = notes
      .filter((n) => n.eleveId === eleve.id && n.maxTotalScore > 0)
      .map((n) => ({
        note20: (n.totalScore / n.maxTotalScore) * 20,
        dateISO: dateByEvaluationId.get(n.evaluationId) ?? "",
      }))
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO));

    if (eleveNotes.length === 0) {
      return { eleveId: eleve.id, moyenne: null, tendance: null, alerte: false, nombreNotes: 0 };
    }

    const moyenne =
      eleveNotes.reduce((sum, n) => sum + n.note20, 0) / eleveNotes.length;

    let tendance: Tendance = null;
    if (eleveNotes.length >= 2) {
      const mid = Math.ceil(eleveNotes.length / 2);
      const premiereMoitie = eleveNotes.slice(0, mid);
      const secondeMoitie = eleveNotes.slice(mid);
      const moyennePremiere =
        premiereMoitie.reduce((sum, n) => sum + n.note20, 0) / premiereMoitie.length;
      const moyenneSeconde =
        secondeMoitie.reduce((sum, n) => sum + n.note20, 0) / secondeMoitie.length;
      const ecart = moyenneSeconde - moyennePremiere;
      if (ecart >= 1) tendance = "hausse";
      else if (ecart <= -1) tendance = "baisse";
      else tendance = "stable";
    }

    const alerte = moyenne < 10 || tendance === "baisse";

    return { eleveId: eleve.id, moyenne, tendance, alerte, nombreNotes: eleveNotes.length };
  });
}
