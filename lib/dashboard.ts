import type { Classe, Eleve, Evaluation, Note } from "@/types/domain";
import type { Niveau, ProgressionItem } from "@/types/pedagogie";

export interface ClasseSummary {
  classe: Classe;
  niveauNom: string | null;
  effectif: number;
  chapitreEnCoursTitre: string | null;
  progressionPct: number | null;
  elevesSansNote: number;
}

/**
 * Résumé d'une classe pour le tableau de bord : chapitre en cours et
 * progression (jointure Classe → Niveau → Progression datée), effectif, et
 * nombre d'élèves sans aucune note enregistrée sur une évaluation de la classe.
 * "Chapitre en cours" = le dernier item de la progression dont la date est déjà
 * passée (ou aujourd'hui) ; à défaut (progression entièrement à venir), le
 * premier item.
 */
export function summarizeClasse(
  classe: Classe,
  niveaux: Niveau[],
  progressionItems: ProgressionItem[],
  eleves: Eleve[],
  evaluations: Evaluation[],
  notes: Note[],
  todayISO: string
): ClasseSummary {
  const niveauNom = niveaux.find((n) => n.id === classe.niveauId)?.nom ?? null;
  const classeEleves = eleves.filter((e) => e.classeId === classe.id);

  const progression = progressionItems
    .filter((p) => p.niveauId === classe.niveauId)
    .sort((a, b) => a.ordre - b.ordre);

  let chapitreEnCoursTitre: string | null = null;
  let progressionPct: number | null = null;
  if (progression.length > 0) {
    const passes = progression.filter((p) => p.dateISO <= todayISO);
    const current = passes.length > 0 ? passes[passes.length - 1]! : progression[0]!;
    chapitreEnCoursTitre = current.titre;
    progressionPct = Math.round((current.ordre / progression.length) * 100);
  }

  const classeEvaluationIds = new Set(
    evaluations.filter((e) => e.classeId === classe.id).map((e) => e.id)
  );
  const eleveIdsAvecNote = new Set(
    notes.filter((n) => classeEvaluationIds.has(n.evaluationId)).map((n) => n.eleveId)
  );
  const elevesSansNote = classeEleves.filter((e) => !eleveIdsAvecNote.has(e.id)).length;

  return {
    classe,
    niveauNom,
    effectif: classeEleves.length,
    chapitreEnCoursTitre,
    progressionPct,
    elevesSansNote,
  };
}
