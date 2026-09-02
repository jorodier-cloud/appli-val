"use server";

import { callMistralText } from "@/lib/mistral-client";

export interface GenerateCorrigeInput {
  niveauNom: string;
  titre: string;
  sujet: string;
}

export type GenerateCorrigeResponse =
  | { ok: true; content: string }
  | { ok: false; error: string };

/**
 * Génère un corrigé détaillé destiné à l'auto-correction des élèves le
 * lendemain de l'évaluation, avec explication du raisonnement et des erreurs
 * fréquentes plutôt qu'une simple réponse.
 */
export async function generateCorrige(
  input: GenerateCorrigeInput
): Promise<GenerateCorrigeResponse> {
  if (!input.niveauNom || !input.titre.trim()) {
    return { ok: false, error: "Niveau ou titre manquant." };
  }

  const systemPrompt = `Tu es professeur de mathématiques dans le système scolaire français, niveau ${input.niveauNom}. Voici une évaluation intitulée « ${input.titre} ».
${
  input.sujet.trim()
    ? `Sujet ou barème fourni :\n${input.sujet.trim()}\n`
    : "Aucun sujet précis n'a été fourni : reconstitue un sujet plausible et cohérent avec ce titre et ce niveau, aligné sur le programme du Bulletin Officiel."
}

Rédige un corrigé détaillé destiné à l'AUTO-CORRECTION des élèves le lendemain de l'évaluation, pendant qu'ils ont leur copie sous les yeux. Pour chaque question : la réponse attendue rédigée intégralement, puis une ou deux phrases qui expliquent le raisonnement et l'erreur la plus fréquente à cet endroit, formulées pour qu'un élève comprenne pourquoi il s'est trompé et pas seulement ce qu'il fallait écrire. Termine par une courte section « Notions à revoir en priorité » qui liste les points les plus susceptibles d'avoir posé problème.

Réponds en français, en Markdown sobre, prêt à projeter ou imprimer, sans préambule.`;

  const result = await callMistralText({
    systemPrompt,
    userContent: "Génère le corrigé demandé.",
    maxTokens: 3000,
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, content: result.data };
}
