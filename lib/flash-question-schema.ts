import { z } from "zod";

// Même logique que lib/evaluation-schema.ts : z.strictObject pour
// additionalProperties:false, requis par le mode strict des Structured Outputs.

export const flashQuestionSchema = z.strictObject({
  enonce: z.string(),
  reponse: z.string(),
});

export const flashQuestionsResponseSchema = z.strictObject({
  questions: z.array(flashQuestionSchema),
});
