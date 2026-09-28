"use server";

import { z } from "zod";
import { callMistralStructured } from "@/lib/mistral-client";

const breakdownItemSchema = z.object({
  question: z.string(),
  pointsAwarded: z.number(),
  pointsPossible: z.number(),
  feedback: z.string(),
});

const gradeResultSchema = z.object({
  studentName: z.string(),
  isReadable: z.boolean(),
  totalScore: z.number(),
  maxScore: z.number(),
  breakdown: z.array(breakdownItemSchema),
  generalFeedback: z.string(),
});

export type GradeCopyResult = z.infer<typeof gradeResultSchema>;

export interface GradeCopyInput {
  niveauNom: string;
  titre: string;
  bareme: string;
  maxScore: number;
  imageDataUrl: string;
}

export type GradeCopyResponse =
  | { ok: true; data: GradeCopyResult }
  | { ok: false; error: string };

/**
 * Corrige une copie photographiée à partir du barème fourni, via Mistral vision
 * (serveur EU). Note question par question + appréciation générale, en JSON
 * structuré prêt à relire et modifier avant validation.
 */
export async function gradeStudentCopy(input: GradeCopyInput): Promise<GradeCopyResponse> {
  if (!input.imageDataUrl.trim()) {
    return { ok: false, error: "Aucune photo de copie fournie." };
  }

  const systemPrompt = `Tu es professeur de mathématiques dans le système scolaire français, niveau ${input.niveauNom}. Tu corriges la copie manuscrite d'un élève pour l'évaluation « ${input.titre} », notée sur ${input.maxScore}.

${
  input.bareme.trim()
    ? `Sujet et barème de référence :\n${input.bareme.trim()}`
    : "Aucun sujet ni barème précis n'a été fourni : évalue la copie sur le fond, en déduisant les questions et le barème probable à partir de ce qui est écrit."
}

Consignes :
- Repère le nom de l'élève s'il est écrit sur la copie ; sinon renvoie "Inconnu".
- Si l'écriture est illisible au point de ne pas pouvoir corriger, renvoie isReadable=false, totalScore=0, un breakdown vide, et explique pourquoi dans generalFeedback.
- Sinon, isReadable=true. Pour chaque question identifiable sur la copie : les points accordés (pointsAwarded) sur le total de la question (pointsPossible), et un feedback court et concret (une phrase) qui explique la note — méthode correcte mais erreur de calcul, raisonnement incomplet, justification manquante, etc.
- totalScore est la somme des pointsAwarded, maxScore vaut ${input.maxScore}.
- generalFeedback est une appréciation constructive de 2 à 3 phrases pour l'élève : points forts, points à travailler, ton bienveillant mais honnête.
- Sois rigoureux : ne survalorise pas une copie faible, ne pénalise pas une méthode correcte pour une erreur de calcul mineure isolée.`;

  const result = await callMistralStructured({
    systemPrompt,
    userContent: [
      { type: "text", text: "Corrige cette copie à partir de la photo ci-jointe." },
      { type: "image_url", imageUrl: input.imageDataUrl },
    ],
    schema: gradeResultSchema,
    schemaName: "grade_copy",
    maxTokens: 3000,
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, data: result.data };
}
