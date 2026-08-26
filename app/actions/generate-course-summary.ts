"use server";

import { supportCoursResponseSchema } from "@/lib/course-content-schema";
import { callMistralStructured } from "@/lib/mistral-client";
import type { BlocCours } from "@/types/contenu";

const SYSTEM_PROMPT = `Tu es un professeur de mathématiques au collège/lycée rigoureux et pédagogue.
Ta tâche est de rédiger un support de cours structuré (synthèse), pas un brouillon de notes.

Consignes impératives :
1. Rédige une courte introduction qui situe le chapitre.
2. Découpe le cours en blocs typés (définition, propriété, théorème, remarque, exemple). Chaque
   propriété/théorème doit être un bloc à part entière, clairement isolé — pas noyé dans du texte
   continu, car ces blocs seront affichés encadrés dans l'application.
3. Utilise la notation LaTeX (entourée de $...$, ou $$...$$ pour les formules en bloc) pour toute
   expression mathématique.
4. Adapte le niveau de rigueur et de vocabulaire au niveau scolaire indiqué.
5. Réponds STRICTEMENT et EXCLUSIVEMENT par un objet JSON valide correspondant au schéma demandé,
   sans aucun texte avant ou après.`;

export interface GenerateCourseSummaryInput {
  niveauNom: string;
  chapitreTitre: string;
}

export type GenerateCourseSummaryResponse =
  | { ok: true; introduction: string; blocs: BlocCours[] }
  | { ok: false; error: string };

export async function generateCourseSummary(
  input: GenerateCourseSummaryInput
): Promise<GenerateCourseSummaryResponse> {
  if (!input.chapitreTitre.trim()) {
    return { ok: false, error: "Titre de chapitre manquant." };
  }

  const result = await callMistralStructured({
    systemPrompt: SYSTEM_PROMPT,
    userContent: `Niveau : ${input.niveauNom}\nChapitre : ${input.chapitreTitre}\nRédige le support de cours de ce chapitre.`,
    schema: supportCoursResponseSchema,
    schemaName: "support_cours_response",
    maxTokens: 6000,
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, introduction: result.data.introduction, blocs: result.data.blocs };
}
