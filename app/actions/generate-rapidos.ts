"use server";

import { callMistralText } from "@/lib/mistral-client";

export type SourceRapidos = "mix" | "annee" | "anterieur";

export interface GenerateRapidosInput {
  niveauNom: string;
  chapitresTraites: string[];
  source: SourceRapidos;
  nb: number;
  notes: string;
  notionsAReactiver: string[];
}

export type GenerateRapidosResponse =
  | { ok: true; content: string }
  | { ok: false; error: string };

function rapidosBase(input: GenerateRapidosInput): string {
  const traites = input.chapitresTraites.length
    ? input.chapitresTraites.join(", ")
    : "aucun chapitre encore traité";

  let source: string;
  if (input.source === "annee") {
    source = `Puise uniquement dans les chapitres déjà traités cette année : ${traites}.`;
  } else if (input.source === "anterieur") {
    source = `Puise uniquement dans les notions des années précédant la ${input.niveauNom}, à réactiver.`;
  } else {
    source = `Puise à la fois dans les chapitres déjà traités cette année (${traites}) et dans les notions des années précédentes à réactiver. Vise environ deux tiers de questions sur l'année en cours, un tiers sur les acquis antérieurs.`;
  }

  const prio = input.notionsAReactiver.length
    ? `\n\nPriorité de réactivation : les évaluations récentes ont signalé ces notions comme mal maîtrisées par la classe — ${input.notionsAReactiver.join(" ; ")}. Fais-les revenir plus souvent que les autres dans la série.`
    : "";

  return `Tu es professeur de mathématiques dans le système scolaire français, niveau ${input.niveauNom}. Tu prépares des « Rapidos » : un rituel de début de séance, 5 questions très courtes, calculables mentalement ou en deux lignes, en 5 minutes maximum.

${source}${prio}

Contraintes : questions courtes et sans contexte inutile, réponses non ambiguës, difficulté régulière d'un Rapido à l'autre, chaque notion revenant à intervalles espacés sur l'ensemble de la série. Réponds en Markdown sobre, prêt à imprimer en noir et blanc, sans préambule ni commentaire.${input.notes.trim() ? `\n\nContrainte supplémentaire : ${input.notes.trim()}` : ""}`;
}

function rapidosPrompt(input: GenerateRapidosInput, start: number, end: number): string {
  return (
    rapidosBase(input) +
    `\n\nRédige les Rapidos n° ${start} à ${end} d'une série de ${input.nb}. Pour chacun : un titre « ## Rapido n° X », les 5 questions numérotées, puis une ligne « **Réponses :** » avec les 5 réponses séparées par des points-virgules.`
  );
}

function rapidosTestPrompt(input: GenerateRapidosInput): string {
  return (
    rapidosBase(input) +
    `\n\nRédige maintenant le test de fin de série, qui suit les ${input.nb} Rapidos. Titre « ## Test de fin de série ». 10 questions numérotées, reprenant les notions travaillées dans les Rapidos, un peu plus exigeantes mais toujours courtes. Durée 15 minutes, noté sur 10. Termine par « ### Corrigé » avec les 10 réponses.`
  );
}

/** Génère une série de Rapidos (rituel de début de séance) + test de fin de série, en plusieurs appels IA. */
export async function generateRapidosSerie(
  input: GenerateRapidosInput
): Promise<GenerateRapidosResponse> {
  if (!input.niveauNom) {
    return { ok: false, error: "Choisissez un niveau." };
  }

  const parts: string[] = [];

  for (let start = 1; start <= input.nb; start += 4) {
    const end = Math.min(start + 3, input.nb);
    const result = await callMistralText({
      systemPrompt: rapidosPrompt(input, start, end),
      userContent: "Génère les Rapidos demandés.",
      maxTokens: 1800,
    });
    if (!result.ok) return { ok: false, error: result.error };
    parts.push(result.data);
  }

  const testResult = await callMistralText({
    systemPrompt: rapidosTestPrompt(input),
    userContent: "Génère le test de fin de série.",
    maxTokens: 1800,
  });
  if (!testResult.ok) return { ok: false, error: testResult.error };
  parts.push(testResult.data);

  const content =
    `# Rapidos — ${input.niveauNom}\n\nRituel de début de séance : 5 questions courtes, ${input.nb} séances puis test de 10 questions.\n\n---\n\n` +
    parts.join("\n\n---\n\n");

  return { ok: true, content };
}
