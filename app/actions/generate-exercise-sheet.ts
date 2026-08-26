"use server";

import { ficheExercicesResponseSchema } from "@/lib/course-content-schema";
import { callMistralStructured } from "@/lib/mistral-client";
import type { BlocCours, Exercice } from "@/types/contenu";

const SYSTEM_PROMPT = `Tu es un professeur de mathématiques au collège/lycée rigoureux et pédagogue.
Ta tâche est de rédiger une fiche d'exercices progressive pour un chapitre donné.

Consignes impératives :
1. Génère des exercices de 4 niveaux, dans cet ordre de difficulté croissante : "application" (application
   directe et immédiate d'une propriété du cours), "complementaire" (exercices complémentaires type
   problème, plusieurs étapes), "complexe" (exercices plus complexes mêlant plusieurs notions),
   "demonstration" (démonstration à mener par l'élève).
2. Génère au moins 2 exercices par niveau.
3. Si un support de cours est fourni ci-dessous, reste rigoureusement cohérent avec lui : mêmes
   notations, mêmes notions déjà posées comme prérequis, ne présuppose rien qui n'y figure pas.
4. Utilise la notation LaTeX (entourée de $...$, ou $$...$$ pour les formules en bloc).
5. Réponds STRICTEMENT et EXCLUSIVEMENT par un objet JSON valide correspondant au schéma demandé,
   sans aucun texte avant ou après.`;

function formatSupportCours(introduction: string, blocs: BlocCours[]): string {
  const blocsText = blocs.map((b) => `[${b.type}] ${b.titre} : ${b.contenu}`).join("\n");
  return `Support de cours de ce chapitre (à respecter) :\n${introduction}\n${blocsText}`;
}

export interface GenerateExerciseSheetInput {
  niveauNom: string;
  chapitreTitre: string;
  supportCours?: { introduction: string; blocs: BlocCours[] } | null;
}

export type GenerateExerciseSheetResponse =
  | { ok: true; exercices: Exercice[] }
  | { ok: false; error: string };

export async function generateExerciseSheet(
  input: GenerateExerciseSheetInput
): Promise<GenerateExerciseSheetResponse> {
  if (!input.chapitreTitre.trim()) {
    return { ok: false, error: "Titre de chapitre manquant." };
  }

  const contextBlock = input.supportCours
    ? `\n\n${formatSupportCours(input.supportCours.introduction, input.supportCours.blocs)}`
    : "";

  const result = await callMistralStructured({
    systemPrompt: SYSTEM_PROMPT,
    userContent: `Niveau : ${input.niveauNom}\nChapitre : ${input.chapitreTitre}${contextBlock}\n\nGénère la fiche d'exercices progressive de ce chapitre.`,
    schema: ficheExercicesResponseSchema,
    schemaName: "fiche_exercices_response",
    maxTokens: 6000,
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, exercices: result.data.exercices };
}
