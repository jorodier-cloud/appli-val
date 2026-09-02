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
    : "aucun chapitre encore coché comme traité";

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

  return `Tu es professeur de mathématiques dans le système scolaire français, niveau ${input.niveauNom}. Tu prépares des « Rapidos » : un rituel de début de séance, 5 questions très courtes, traitables mentalement ou en deux lignes, en 5 minutes maximum.

${source}${prio}

Exigence de niveau, impérative : les questions doivent être dignes d'un élève de ${input.niveauNom}. Sont formellement exclues les questions de niveau primaire (tables de multiplication simples, « le double de 12 », « la moitié de 20 », additions à un chiffre). Vise le niveau d'un exercice de calcul mental exigeant du programme : opérations sur les relatifs et les fractions, puissances et écriture scientifique, calcul littéral, proportionnalité et pourcentages, divisibilité et PGCD, conversions d'unités, géométrie de base.

Exigence de variété, impérative : sur l'ensemble de la série, ne répète JAMAIS deux fois la même question à l'identique, et ne redonne pas la même valeur numérique pour une même notion. Chaque notion revient à intervalles espacés, mais toujours sous une forme ou avec des nombres différents.

Ne sors jamais du programme du niveau ${input.niveauNom}.${input.notes.trim() ? `\n\nContrainte supplémentaire : ${input.notes.trim()}` : ""}`;
}

function rapidosPrompt(input: GenerateRapidosInput, start: number, end: number): string {
  return (
    rapidosBase(input) +
    `

Produis les Rapidos numérotés de ${start} à ${end} (soit ${end - start + 1} Rapidos), regroupés deux par deux en tableaux Markdown à deux colonnes, un Rapido par colonne. Respecte EXACTEMENT ce format, sans rien ajouter autour :

| Rapido ${start} | Rapido ${start + 1} |
|---|---|
| item 1 | item 1 |
| item 2 | item 2 |
| item 3 | item 3 |
| item 4 | item 4 |
| item 5 (conversion d'unité) | item 5 (conversion d'unité) |

(puis un tableau identique pour la paire suivante s'il en reste, séparé par une ligne vide)

Ne mets AUCUNE réponse ni corrigé : ce sont des feuilles vierges que les élèves complètent en classe, la correction se fait à l'oral juste après.

Chaque Rapido contient exactement 5 items :
- 2 ou 3 calculs directs à compléter, l'item se terminant par « = » pour que l'élève écrive la réponse à la suite
- 1 ou 2 questions verbales courtes (« Calculer… », « Donner… », « Vrai / Faux : … », « Compléter : … »), sans « = » final
- le dernier item est toujours une courte conversion d'unité à compléter (durée, longueur, aire, volume), au format « 0,25 h = ……… min »

N'utilise ni LaTeX ni émoji : notation courante uniquement (×, ÷, exposants Unicode comme 3² ou 10⁻⁴, fractions sous la forme a/b, racines sous la forme √16).`
  );
}

function rapidosTestPrompt(input: GenerateRapidosInput): string {
  return (
    rapidosBase(input) +
    `

Rédige maintenant le test de fin de série, qui suit les ${input.nb} Rapidos. Titre « # Test de fin de série ». 10 questions numérotées, reprenant les notions travaillées dans les Rapidos, un peu plus exigeantes mais toujours courtes. Durée 15 minutes, noté sur 10. Termine par « ## Corrigé » suivi des 10 réponses numérotées.

Comme le test est un écrit noté, il conserve son corrigé (contrairement aux Rapidos eux-mêmes).

N'utilise ni LaTeX ni émoji : notation courante uniquement (×, ÷, exposants Unicode, fractions sous la forme a/b, racines sous la forme √16).`
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

  const cadence = input.nb >= 12 ? "3 à 4" : "3";
  const enTete =
    `%%TITREBOX%% Rapido-Maths ${input.niveauNom}\n\n` +
    `**Rituel : en arrivant en classe, vous sortez la fiche rapido-maths et vous faites le rapido demandé. Cela doit devenir un automatisme.**\n` +
    `**La correction sera faite ensemble. Il faudra revoir ces rapidos régulièrement : toutes les ${cadence} semaines, il y aura une évaluation sur les rapidos effectués.**\n\n`;

  const content =
    enTete +
    parts.join("\n\n") +
    `\n\n*Prochaine séance : test sur ces ${input.nb} rapidos.*\n\n---\n\n` +
    testResult.data;

  return { ok: true, content };
}
