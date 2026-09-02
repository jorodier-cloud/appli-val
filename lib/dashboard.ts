import type { Niveau, ProgressionItem } from "@/types/pedagogie";

export interface NiveauSummary {
  niveau: Niveau;
  chapitresTraites: number;
  chapitresTotal: number;
  progressionPct: number;
  prochainChapitre: string | null;
}

/** Résumé d'un niveau pour l'accueil : progression et prochain chapitre non traité. */
export function summarizeNiveau(niveau: Niveau, progressionItems: ProgressionItem[]): NiveauSummary {
  const chapitres = progressionItems
    .filter((p) => p.niveauId === niveau.id)
    .sort((a, b) => a.ordre - b.ordre);
  const chapitresTraites = chapitres.filter((c) => c.traite).length;
  const prochain = chapitres.find((c) => !c.traite) ?? null;

  return {
    niveau,
    chapitresTraites,
    chapitresTotal: chapitres.length,
    progressionPct: chapitres.length ? Math.round((chapitresTraites / chapitres.length) * 100) : 0,
    prochainChapitre: prochain?.titre ?? null,
  };
}
