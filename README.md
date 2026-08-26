# Riwaq — EduTeach AI (Prototype)

Prototype Next.js 15 pour enseignants du second degré : correction automatique
de copies de mathématiques manuscrites par IA vision (Mistral AI,
`@mistralai/mistralai`, serveur EU), progression pédagogique, contenus générés,
suivi de classe et compétences. « Riwaq » est un nom provisoire — la galerie à
arcades qui distribue les pièces d'une maison marocaine.

## Installation

```bash
npm install
cp .env.local.example .env.local
```

Renseignez votre clé dans `.env.local` :

```
MISTRAL_API_KEY=...
```

## Lancer en développement

```bash
npm run dev
```

Puis ouvrez [http://localhost:3000](http://localhost:3000).

L'application démarre et affiche l'interface sans clé API ; la clé n'est
nécessaire qu'au moment de cliquer sur **« Lancer la pré-correction IA »**.

## Vérification

```bash
npx tsc --noEmit
npm run build
```

## Fonctionnement

L'application a cinq sections dans la barre latérale :

- **Tableau de bord** (`/`) — `components/dashboard.tsx` : une carte par classe
  active (chapitre en cours, % de progression, élèves sans note), compteurs
  globaux (classes actives, fiches générées cette semaine, taux moyen de
  compétences acquises) et un raccourci « reprendre où vous en étiez » vers la
  dernière note enregistrée. Calcul déterministe, pas d'IA (`lib/dashboard.ts`).
- **Mes classes** (`/classes`) — `components/classes-hub.tsx` : création des
  classes et de leurs élèves (`classes-manager.tsx`), puis, une classe
  sélectionnée, trois sous-onglets — *Élèves & notes* (tableau de notes par
  évaluation, notes issues de la correction IA ou saisies manuellement, édition
  inline, `notes-table.tsx`), *Compétences* (grille classe × compétence, échelle
  NA/PA/A/D par élève et par évaluation, `competences-grid.tsx`,
  `lib/competences.ts`) et *Vie de classe* (synthèse par élève — moyenne /20,
  tendance, point d'alerte, calculée depuis les notes déjà saisies via
  `lib/eleve-synthese.ts` — et bilan structuré de conseil de classe : points
  positifs / vigilance / décisions, `conseil-classe.tsx`).
- **Générateur de supports** (`/generateur`) — `components/progression-manager.tsx` :
  progression annuelle par niveau (chapitres datés), génération IA de questions
  flash par chapitre (`app/actions/generate-flash-questions.ts`, texte seul),
  génération automatique d'un test de réactivation tous les 10 chapitres qui
  pioche dans les questions flash des chapitres déjà couverts, et pour chaque
  chapitre : génération IA d'un support de cours structuré en blocs typés
  (définition/propriété/théorème/exemple/remarque, affichés encadrés), d'une
  fiche d'exercices progressive à 4 niveaux (cohérente avec le support de cours),
  et d'une évaluation + corrigé détaillé (alignée sur la fiche d'exercices) — voir
  `app/actions/generate-course-summary.ts`, `generate-exercise-sheet.ts` et
  `generate-evaluation.ts`. Toujours par chapitre : planning de révision espacée
  J+1/J+3/J+7 (`lib/revision-plan.ts`), qui pioche sans nouvel appel IA dans les
  questions flash et les exercices "application" déjà générés pour ce chapitre,
  réparti sans chevauchement entre les 3 échéances — chacune exportable en texte
  prêt à coller dans le cahier de textes (pas d'intégration ENT, voir Lot 6).
- **Évaluations & correction IA** (`/evaluations`) — `components/correction-workspace.tsx` :
  le prof choisit une classe, une évaluation (existante ou créée à la volée) et
  un élève, saisit le barème et dépose une photo de copie. L'image est
  redimensionnée côté client (≤1568px, JPEG) avant envoi. La Server Action
  `app/actions/correct-copy.ts` appelle Mistral (`mistral-medium-latest`, région
  **EU** — `api.eu.mistral.ai`) avec sortie structurée contrainte par le schéma
  Zod de `types/evaluation.ts`. Le résultat s'affiche entièrement éditable
  (points par question, commentaire) ; l'élève détecté par l'IA est rapproché
  automatiquement de la liste de la classe. « Enregistrer la note » persiste le
  résultat et enchaîne sur la copie suivante.
- **Banque de ressources** (`/banque`) — `components/banque-ressources.tsx` :
  tout le contenu pédagogique déjà généré (supports de cours, fiches
  d'exercices, évaluations), filtrable par niveau, plus les fiches pratiques
  rédigées par vous (texte libre, classées par thème, pas de génération IA,
  `fiches-manager.tsx`) — fiches Gestion de classe et fiches méthodologiques
  "apprendre à apprendre" (`type: "methodologie"`).

Les appels IA texte (questions flash, contenu pédagogique) partagent
`lib/mistral-client.ts` (client Mistral EU + Structured Outputs + mapping
d'erreurs), également utilisé par la correction de copie.

Persistance : `localStorage` (prototype mono-appareil/mono-navigateur, voir
`CAHIER_DES_CHARGES.md` §5 — pas de vraie base de données pour l'instant).
