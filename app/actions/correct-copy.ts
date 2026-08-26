"use server";

import { copyCorrectionResultSchema } from "@/lib/evaluation-schema";
import { callMistralStructured } from "@/lib/mistral-client";
import { clamp } from "@/lib/utils";
import type { CopyCorrectionResult } from "@/types/evaluation";

const SYSTEM_PROMPT = `Tu es un professeur de mathématiques au collège/lycée rigoureux et bienveillant.
Ta tâche est de corriger la copie d'évaluation manuscrite fournie en image selon le barème transmis.

Consignes impératives :
1. Distingue rigoureusement une erreur de calcul d'une erreur de méthode/démonstration.
2. Ignore le contenu raturé ou rayé pour l'attribution des points, mais mentionne-le dans 'crossed_out_summary' si pertinent.
3. Analyse le cheminement étape par étape.
4. Renvoie une transcription au format LaTeX propre (entourée de $...$ si inline) pour toute expression mathématique.
5. Évalue ton niveau de confiance (0.0 à 1.0) sur la lisibilité de l'écriture manuscrite pour chaque question.
6. Réponds STRICTEMENT et EXCLUSIVEMENT par un objet JSON valide correspondant au schéma demandé, sans aucun texte avant ou après.`;

export interface CorrectCopyInput {
  imageBase64: string; // sans le préfixe data:...;base64,
  mediaType: "image/jpeg" | "image/png";
  gradingScale: string;
}

export type CorrectCopyResponse =
  | { ok: true; data: CopyCorrectionResult }
  | { ok: false; error: string; fallback: CopyCorrectionResult };

function unreadableFallback(): CopyCorrectionResult {
  return {
    is_readable: false,
    global_confidence: 0,
    student_name: null,
    questions: [],
    total_score: 0,
    max_total_score: 0,
    teacher_summary_comment: "",
  };
}

function normalizeResult(raw: CopyCorrectionResult): CopyCorrectionResult {
  const questions = raw.questions.map((q) => {
    const max_points = Math.max(0, q.max_points);
    return {
      ...q,
      question_confidence: clamp(q.question_confidence, 0, 1),
      points_awarded: clamp(q.points_awarded, 0, max_points),
      max_points,
    };
  });

  return {
    ...raw,
    global_confidence: clamp(raw.global_confidence, 0, 1),
    questions,
  };
}

export async function correctCopy(
  input: CorrectCopyInput
): Promise<CorrectCopyResponse> {
  if (!input.imageBase64 || !input.gradingScale.trim()) {
    return {
      ok: false,
      error: "Image ou barème manquant.",
      fallback: unreadableFallback(),
    };
  }

  const result = await callMistralStructured({
    systemPrompt: SYSTEM_PROMPT,
    userContent: [
      { type: "text", text: `Barème / consignes de l'évaluation :\n${input.gradingScale}` },
      { type: "image_url", imageUrl: `data:${input.mediaType};base64,${input.imageBase64}` },
    ],
    schema: copyCorrectionResultSchema,
    schemaName: "copy_correction_result",
    maxTokens: 16000,
  });

  if (!result.ok) {
    return { ok: false, error: result.error, fallback: unreadableFallback() };
  }

  return { ok: true, data: normalizeResult(result.data) };
}
