"use server";

import { flashQuestionsResponseSchema } from "@/lib/flash-question-schema";
import { callMistralStructured } from "@/lib/mistral-client";

const SYSTEM_PROMPT = `Tu es un professeur de mathématiques au collège/lycée rigoureux et bienveillant.
Ta tâche est de générer de courtes questions flash à poser en tout début de séance, pour réactiver
les prérequis d'un chapitre donné.

Consignes impératives :
1. Chaque question doit être courte, précise, et se répondre en moins d'une minute à l'oral.
2. Fournis la réponse attendue de façon concise pour chaque question.
3. Adapte le niveau de difficulté et de vocabulaire au niveau scolaire indiqué.
4. Utilise la notation LaTeX (entourée de $...$) pour toute expression mathématique.
5. Réponds STRICTEMENT et EXCLUSIVEMENT par un objet JSON valide correspondant au schéma demandé,
   sans aucun texte avant ou après.`;

export interface GenerateFlashQuestionsInput {
  niveauNom: string;
  chapitreTitre: string;
  count?: number;
}

export type GenerateFlashQuestionsResponse =
  | { ok: true; questions: { enonce: string; reponse: string }[] }
  | { ok: false; error: string };

export async function generateFlashQuestions(
  input: GenerateFlashQuestionsInput
): Promise<GenerateFlashQuestionsResponse> {
  if (!input.chapitreTitre.trim()) {
    return { ok: false, error: "Titre de chapitre manquant." };
  }

  const count = input.count ?? 4;

  const result = await callMistralStructured({
    systemPrompt: SYSTEM_PROMPT,
    userContent: `Niveau : ${input.niveauNom}\nChapitre : ${input.chapitreTitre}\nGénère exactement ${count} questions flash.`,
    schema: flashQuestionsResponseSchema,
    schemaName: "flash_questions_response",
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, questions: result.data.questions };
}
