"use server";

import { callMistralText } from "@/lib/mistral-client";

export type TypeSupport = "synthese" | "fiche" | "evaluation";

export interface GenerateSupportInput {
  type: TypeSupport;
  niveauNom: string;
  chapitreTitre: string;
  notes: string;
}

export type GenerateSupportResponse =
  | { ok: true; content: string }
  | { ok: false; error: string };

const SPEC: Record<TypeSupport, string> = {
  synthese: `Produis une synthèse de cours : objectifs d'apprentissage, définitions encadrées, propriétés et méthodes, deux ou trois exemples types entièrement rédigés, et une courte liste des erreurs fréquentes.`,
  fiche: `Produis une fiche d'exercices à difficulté progressive : 3 exercices d'application directe, 3 exercices intermédiaires, 2 problèmes de synthèse. Puis un corrigé détaillé sous un titre « Corrigé ».`,
  evaluation: `Produis une évaluation notée sur 20, durée 55 minutes, 4 exercices. Indique le barème par compétence à côté de chaque exercice (Chercher, Modéliser, Représenter, Calculer, Raisonner, Communiquer). Termine par un tableau de barème détaillé puis le corrigé.`,
};

/** Génère un support pédagogique (synthèse, fiche d'exercices ou évaluation) en Markdown. */
export async function generateSupport(
  input: GenerateSupportInput
): Promise<GenerateSupportResponse> {
  if (!input.niveauNom || !input.chapitreTitre.trim()) {
    return { ok: false, error: "Choisissez un niveau et un chapitre." };
  }

  const systemPrompt = `Tu es professeur de mathématiques dans le système scolaire français. Niveau : ${input.niveauNom}. Chapitre : ${input.chapitreTitre}. Respecte strictement le programme du Bulletin Officiel pour ce niveau. Rédige en français, en Markdown, sobre et prêt à imprimer en noir et blanc. Pas de préambule ni de commentaire, uniquement le document.

${SPEC[input.type]}${input.notes.trim() ? `\n\nContrainte supplémentaire : ${input.notes.trim()}` : ""}`;

  const result = await callMistralText({
    systemPrompt,
    userContent: "Génère le document demandé.",
    maxTokens: 3500,
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, content: result.data };
}
