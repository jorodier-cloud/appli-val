# Riwaq — L'espace du professeur (Prototype)

Prototype Next.js 15 pour un professeur de mathématiques du second degré :
progression annuelle par niveau, génération de supports pédagogiques par IA
(synthèses, fiches d'exercices, évaluations, séries de « Rapidos »), suivi des
notes et corrigés auto-correctifs, et banque de ressources. « Riwaq » est un
nom provisoire — la galerie à arcades qui distribue les pièces d'une maison
marocaine.

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
nécessaire qu'au moment de générer un support avec l'IA.

## Vérification

```bash
npx tsc --noEmit
npm run build
```

## Fonctionnement

L'application a cinq sections dans la barre latérale :

- **Accueil** (`/`) — `components/dashboard.tsx` : une carte par niveau
  (chapitre à venir, % de progression), un rappel des évaluations dont le
  corrigé est prêt mais pas encore restitué aux élèves (« À restituer »), les
  derniers supports générés, et un accès rapide à la sauvegarde manuelle.
  Calcul déterministe, pas d'IA (`lib/dashboard.ts`).
- **Mes progressions** (`/progressions`) — `components/progressions-manager.tsx` :
  une progression par niveau (créé/supprimé à la volée). Import d'un fichier
  `.docx` (via `mammoth`), `.md`, `.txt` ou `.csv`, ou saisie/collage direct
  dans une zone de texte (« Chapitre — période »). Chaque chapitre est ensuite
  éditable en ligne (titre, période, case « traité »), réordonnable par
  flèches ou par glisser-déposer (appui long sur la poignée, tactile et
  souris), et supprimable. Export de la progression en texte.
- **Générateur de supports** (`/generateur`) — `components/generateur-cards.tsx` :
  pour un niveau et un chapitre de la progression, génération IA d'une
  **synthèse de cours**, d'une **fiche d'exercices progressive** (corrigé
  inclus) ou d'une **évaluation** notée sur 20 avec barème par compétences
  (`app/actions/generate-content.ts`). Quatrième carte : une **série de
  Rapidos** — rituel de 5 questions courtes en début de séance, puisant dans
  les chapitres déjà cochés « traité » et/ou dans les rappels d'années
  antérieures, avec un test de 10 questions en fin de série
  (`app/actions/generate-rapidos.ts`). Les notions signalées comme ratées
  dans les évaluations (voir ci-dessous) sont réinjectées en priorité dans la
  série suivante. Chaque génération est enregistrée dans la banque.
- **Évaluations & correction** (`/evaluations`) — `components/evaluations-manager.tsx` :
  suivi manuel des notes par évaluation (niveau, titre, date, sujet ou barème
  facultatif, notes élèves collées en `Nom;Note`), génération d'un **corrigé
  détaillé** pensé pour l'auto-correction des élèves le lendemain — réponse
  rédigée, explication du raisonnement et de l'erreur fréquente à cet endroit
  (`app/actions/generate-corrige.ts`) — et suivi de sa **restitution** (J+1).
  Un champ libre permet de noter les notions ratées par la classe, réutilisées
  par le générateur de Rapidos.
- **Banque de ressources** (`/banque`) — `components/banque-ressources.tsx` :
  tout ce qui a été généré (synthèses, fiches, évaluations, séries de
  Rapidos, corrigés), filtrable par niveau, avec aperçu, copie du texte,
  téléchargement au format Word et suppression (`components/resource-modal.tsx`).

Les appels IA texte libre (synthèse, fiche, évaluation, Rapidos, corrigé)
passent par `lib/mistral-client.ts` (`callMistralText`, client Mistral EU —
`api.eu.mistral.ai` — et mapping d'erreurs partagé, voir
`lib/mistral-errors.ts`).

Persistance : `localStorage` (prototype mono-appareil/mono-navigateur,
`lib/store.ts`). Une sauvegarde manuelle (export/import JSON complet,
`components/backup-controls.tsx`, accessible depuis la barre latérale et
l'accueil) protège contre un vidage du cache navigateur ou un changement
d'appareil.
