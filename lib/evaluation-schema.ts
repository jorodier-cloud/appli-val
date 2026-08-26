import { z } from "zod";

// Miroir Zod de types/evaluation.ts, adapté aux contraintes des Structured Outputs
// (JSON Schema strict, façon OpenAI/Mistral) : z.strictObject impose
// additionalProperties:false, et toute clé optionnelle du contrat TS doit être
// nullable plutôt qu'absente (required inclut aussi les champs nullable). Les
// contraintes numériques (min/max) ne sont pas fiables selon les fournisseurs
// (validées côté client, elles feraient échouer le parse si le modèle renvoie une
// confiance à 1.01) : le clamp se fait après réception, dans la Server Action.

export const errorClassificationSchema = z.enum([
  "NONE",
  "CALCULATION_ERROR",
  "REASONING_ERROR",
  "SYNTAX_LATEX_ERROR",
  "MISSING_UNIT_OR_JUSTIFICATION",
]);

export const mathQuestionEvalSchema = z.strictObject({
  question_number: z.string(),
  question_confidence: z.number(),
  transcribed_latex: z.string(),
  has_crossed_out_content: z.boolean(),
  crossed_out_summary: z.string().nullable(),
  error_classification: errorClassificationSchema,
  points_awarded: z.number(),
  max_points: z.number(),
  step_by_step_feedback: z.array(z.string()),
});

export const copyCorrectionResultSchema = z.strictObject({
  is_readable: z.boolean(),
  global_confidence: z.number(),
  student_name: z.string().nullable(),
  questions: z.array(mathQuestionEvalSchema),
  total_score: z.number(),
  max_total_score: z.number(),
  teacher_summary_comment: z.string(),
});
