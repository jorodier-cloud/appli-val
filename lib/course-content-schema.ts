import { z } from "zod";

// Même logique que lib/evaluation-schema.ts et lib/flash-question-schema.ts :
// z.strictObject pour additionalProperties:false, requis par le mode strict des
// Structured Outputs.

export const typeBlocCoursSchema = z.enum([
  "definition",
  "propriete",
  "theoreme",
  "remarque",
  "exemple",
]);

export const blocCoursSchema = z.strictObject({
  type: typeBlocCoursSchema,
  titre: z.string(),
  contenu: z.string(),
});

export const supportCoursResponseSchema = z.strictObject({
  introduction: z.string(),
  blocs: z.array(blocCoursSchema),
});

export const niveauExerciceSchema = z.enum([
  "application",
  "complementaire",
  "complexe",
  "demonstration",
]);

export const exerciceSchema = z.strictObject({
  niveau: niveauExerciceSchema,
  enonce: z.string(),
});

export const ficheExercicesResponseSchema = z.strictObject({
  exercices: z.array(exerciceSchema),
});

export const exerciceEvalueSchema = z.strictObject({
  enonce: z.string(),
  bareme: z.string(),
  corrige: z.string(),
});

export const evaluationGenereeResponseSchema = z.strictObject({
  exercices: z.array(exerciceEvalueSchema),
});
