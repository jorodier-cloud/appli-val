"use server";

import { callMistralText } from "@/lib/mistral-client";

export type TypeSupport = "synthese" | "fiche" | "evaluation";

export interface GenerateSupportInput {
  type: TypeSupport;
  niveauNom: string;
  chapitreTitre: string;
  notes: string;
  etablissement?: string;
}

export type GenerateSupportResponse =
  | { ok: true; content: string }
  | { ok: false; error: string };

/** Règles de notation communes : jamais de LaTeX brut, jamais d'émojis. */
const REGLES_NOTATION = `Règles impératives de rédaction :
- N'utilise JAMAIS de délimiteurs ou commandes LaTeX. Sont interdits : \\( \\), $ $, \\times, \\div, \\frac{}{}, \\sqrt, \\text{}, et toute accolade de commande.
- Écris les mathématiques en notation courante directement lisible : × pour multiplier, ÷ pour diviser, les puissances en exposants Unicode (3², 10⁻⁴, aⁿ), les fractions sous la forme a/b, les racines sous la forme √16.
- N'utilise AUCUN émoji ni pictogramme décoratif. Le document doit être sobre, en noir et blanc, prêt à imprimer.
- Pas de préambule, pas de commentaire final : uniquement le document.`;

function cycleDe(niveau: string): string {
  if (/6\s*[eè]/i.test(niveau)) return "cycle 3";
  if (/[543]\s*[eè]/i.test(niveau)) return "cycle 4";
  return "lycée";
}

function synthesePrompt(input: GenerateSupportInput): string {
  const cycle = cycleDe(input.niveauNom);
  const etab = input.etablissement?.trim();
  return `Tu es professeur de mathématiques dans le système scolaire français, niveau ${input.niveauNom}. Chapitre : « ${input.chapitreTitre} ». Respecte strictement le programme officiel (${cycle}).

Produis une synthèse de cours en suivant EXACTEMENT ce gabarit de mise en page, qui est un format imposé à respecter à la lettre :

${etab ? `%%ETAB%% ${etab}` : ""}
%%TITRE%% ${input.chapitreTitre}
%%SOUSTITRE%% Synthèse de cours

# I. <Premier grand thème du chapitre>

> **DÉFINITION**
> Rédaction complète et rigoureuse de la définition, une phrase par ligne, chaque ligne précédée de « > ».

Exemple : un exemple numérique concret rédigé en une ou deux phrases, hors encadré, juste après la définition.

## <Sous-thème si nécessaire>

> **PROPRIÉTÉ**
> Contenu de l'encadré, une idée par ligne.

# II. <Deuxième grand thème>

(même structure : encadrés puis exemples en texte courant)

[Continue ainsi pour tous les thèmes du chapitre — vise 4 à 6 sections numérotées en chiffres romains, chacune avec un ou deux encadrés et leurs exemples]

## Compétences attendues (Bulletin officiel, ${cycle})

- (liste réaliste et complète des compétences attendues pour ce chapitre précis à ce niveau)

Règles de structure : chaque encadré (lignes commençant par « > ») débute par un libellé en gras et en MAJUSCULES nommant précisément son contenu — DÉFINITION, PROPRIÉTÉ, PROPRIÉTÉS, MÉTHODE, À RETENIR, REMARQUE, ou un intitulé descriptif comme « CRITÈRES DE DIVISIBILITÉ » si c'est plus clair. Les exemples ne sont JAMAIS dans un encadré : toujours en paragraphe simple commençant par « Exemple : ». Sois rigoureux, complet et fidèle au niveau de classe : c'est un document que les élèves conservent toute l'année.

${REGLES_NOTATION}${input.notes.trim() ? `\n\nContrainte supplémentaire : ${input.notes.trim()}` : ""}`;
}

function fichePrompt(input: GenerateSupportInput): string {
  const lycee = /2nde|seconde|1\s*[èe]re|premi[eè]re|term|tle/i.test(input.niveauNom);
  const demoNiveau = lycee
    ? `une démonstration algébrique ou analytique rigoureuse, avec hypothèses explicites, étapes de raisonnement justifiées une à une, et conclusion clairement énoncée`
    : `une démonstration accessible au collège, s'appuyant sur une propriété du cours (Pythagore, Thalès, propriétés des nombres, calcul littéral selon le chapitre), rédigée avec hypothèses, étapes justifiées et conclusion`;

  return `Tu es professeur de mathématiques dans le système scolaire français, niveau ${input.niveauNom}. Chapitre : « ${input.chapitreTitre} ». Respecte strictement le programme officiel.

Produis une fiche d'exercices en suivant EXACTEMENT ce gabarit de mise en page, qui est un format imposé :

# Fiche d'exercices — ${input.chapitreTitre} (Niveau ${input.niveauNom})

## Exercices d'application directe

### Exercice 1
Consigne de l'exercice.
- premier item
- deuxième item
- (3 à 4 items)

### Exercice 2
### Exercice 3

---

## Exercices intermédiaires

### Exercice 4
(un cran plus difficile, plusieurs étapes de raisonnement)

### Exercice 5
### Exercice 6

---

## Problèmes de synthèse

### Problème 1
Énoncé contextualisé rédigé en une ou deux phrases, mobilisant plusieurs notions du chapitre.
- question a
- question b
- question c éventuelle, plus exigeante

### Problème 2

---

## Démonstration

### Exercice 7
Énonce clairement ce qu'il faut démontrer (« Démontrer que… » / « Montrer que… »), avec ${demoNiveau}. Ce n'est pas un calcul à effectuer mais un raisonnement à rédiger en toutes lettres.

---

# Corrigé

(reprends exactement la même structure et la même numérotation que l'énoncé, section par section, exercice par exercice, jusqu'au bout — avec les étapes de calcul détaillées, et pour l'exercice 7 la démonstration complète rédigée comme un élève devrait l'écrire sur sa copie)

Exigence de niveau : les exercices doivent être réellement au niveau ${input.niveauNom} et progresser en difficulté. Les problèmes de synthèse mobilisent plusieurs notions à la fois et demandent un raisonnement, pas une simple application de formule.

${REGLES_NOTATION}${input.notes.trim() ? `\n\nContrainte supplémentaire : ${input.notes.trim()}` : ""}`;
}

function evaluationPrompt(input: GenerateSupportInput): string {
  return `Tu es professeur de mathématiques dans le système scolaire français, niveau ${input.niveauNom}. Chapitre : « ${input.chapitreTitre} ». Respecte strictement le programme du Bulletin Officiel pour ce niveau.

Produis une évaluation notée sur 20, durée 55 minutes, 4 exercices de difficulté croissante. Indique le barème par compétence à côté de chaque exercice (Chercher, Modéliser, Représenter, Calculer, Raisonner, Communiquer). Termine par un tableau de barème détaillé, puis par le corrigé complet sous un titre « Corrigé ».

${REGLES_NOTATION}${input.notes.trim() ? `\n\nContrainte supplémentaire : ${input.notes.trim()}` : ""}`;
}

/** Génère un support pédagogique (synthèse, fiche d'exercices ou évaluation) en Markdown. */
export async function generateSupport(
  input: GenerateSupportInput
): Promise<GenerateSupportResponse> {
  if (!input.niveauNom || !input.chapitreTitre.trim()) {
    return { ok: false, error: "Choisissez un niveau et un chapitre." };
  }

  const systemPrompt =
    input.type === "synthese"
      ? synthesePrompt(input)
      : input.type === "fiche"
        ? fichePrompt(input)
        : evaluationPrompt(input);

  const result = await callMistralText({
    systemPrompt,
    userContent: "Génère le document demandé.",
    maxTokens: 3500,
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, content: result.data };
}
