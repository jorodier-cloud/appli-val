"use server";

import { evaluationGenereeResponseSchema } from "@/lib/course-content-schema";
import { callMistralStructured } from "@/lib/mistral-client";
import type { Exercice, ExerciceEvalue } from "@/types/contenu";

const SYSTEM_PROMPT = `Tu es un professeur de mathématiques au collège/lycée rigoureux et bienveillant.
Ta tâche est de rédiger une évaluation à difficulté progressive pour un chapitre donné, avec son
corrigé détaillé.

Consignes impératives :
1. Les exercices doivent être à difficulté progressive, alignés sur la fiche d'exercices du chapitre
   fournie ci-dessous (mêmes types de questions, même niveau de difficulté global, sans les recopier
   à l'identique).
2. Indique un barème pour chaque exercice (ex : "3 points").
3. Rédige un corrigé détaillé, étape par étape, pour chaque exercice.
4. Utilise la notation LaTeX (entourée de $...$, ou $$...$$ pour les formules en bloc).
5. Réponds STRICTEMENT et EXCLUSIVEMENT par un objet JSON valide correspondant au schéma demandé,
   sans aucun texte avant ou après.`;

function formatFicheExercices(exercices: Exercice[]): string {
  return exercices.map((e) => `[${e.niveau}] ${e.enonce}`).join("\n");
}

export interface GenerateEvaluationInput {
  niveauNom: string;
  chapitreTitre: string;
  ficheExercices?: Exercice[] | null;
}

export type GenerateEvaluationResponse =
  | { ok: true; exercices: ExerciceEvalue[] }
  | { ok: false; error: string };

export async function generateEvaluation(
  input: GenerateEvaluationInput
): Promise<GenerateEvaluationResponse> {
  if (!input.chapitreTitre.trim()) {
    return { ok: false, error: "Titre de chapitre manquant." };
  }

  const contextBlock = input.ficheExercices?.length
    ? `\n\nFiche d'exercices de ce chapitre (à prendre comme référence de difficulté) :\n${formatFicheExercices(input.ficheExercices)}`
    : "";

  const result = await callMistralStructured({
    systemPrompt: SYSTEM_PROMPT,
    userContent: `Niveau : ${input.niveauNom}\nChapitre : ${input.chapitreTitre}${contextBlock}\n\nGénère l'évaluation progressive de ce chapitre avec son corrigé.`,
    schema: evaluationGenereeResponseSchema,
    schemaName: "evaluation_generee_response",
    maxTokens: 8000,
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, exercices: result.data.exercices };
}
