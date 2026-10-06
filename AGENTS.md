# Instructions pour les agents (Codex, Codex, ChatGPT)

## Style de réponse
- Interdiction absolue de bavarder : pas de phrases de transition (« Je fais x... », « Bon... », « Poussons vers... », « Maintenant... », etc.).
- Ultra-concis. N'afficher que les erreurs et les questions bloquantes.
- Exécuter directement plutôt que d'annoncer ce qui va être fait.
- Cette règle s'applique à tous les agents (Codex, Codex, ChatGPT Work).

## Mémoire et synchronisation
- **Au début de chaque tâche :** lire attentivement l'ensemble de ce fichier et son historique.
- **À la fin de chaque tâche :** mettre systématiquement à jour la section « Journal de bord » ci-dessous en indiquant la date, l'agent utilisé (Codex ou Codex), un résumé court des actions réalisées, les fichiers touchés et les étapes suivantes.

## Journal de bord

### 2026-10-06 — Claude — Interface : mobile, lisibilité, répartition des notes (skills frontend-design, dataviz, webapp-testing)
- Mobile : la barre latérale (236 px) occupait ~60 % d'un écran de téléphone → remplacée sous 768 px par une barre d'onglets fixe en bas (icônes + libellés courts, zone de sécurité iOS) ; marges de page réduites (`components/sidebar-nav.tsx`, `app/**/page.tsx`).
- Bug visuel corrigé : l'arche des cartes (46 px) dépassait le padding (34 px) et chevauchait les titres → arche 40 × 26 px, padding 42 px (`app/globals.css`).
- Libellés en capitales espacées → casse de phrase, plus lisibles ; focus clavier visible ; `prefers-reduced-motion` respecté.
- Nouveau : histogramme de répartition des notes par évaluation (tranches de 2 points, couleur terracotta validée par le script dataviz, lecture au survol et aux flèches, tableau pour lecteurs d'écran) — `components/notes-histogram.tsx`, intégré dans `components/correction-copie.tsx` ; ligne de statistiques recomposée (plus de libellés coupés).
- Vérifié : `npx tsc --noEmit`, `npm run build`, captures Playwright desktop/mobile avant/après, test clavier de l'histogramme (bornes 0 et 20 incluses), aucune erreur console.
- Prochaine étape : code d'accès sur l'app déployée (toujours ouvert, voir entrée du 2026-10-05).

### 2026-10-05 — Claude — Audit et correctifs (skills code-review, security-review, session-start-hook, webapp-testing)
- Bug corrigé : modifier une évaluation effaçait le détail par question et l'appréciation des copies corrigées par photo (`components/evaluations-manager.tsx`, fusion par nom).
- Bug corrigé : après une erreur IA, la correction de copie restait bloquée (plus de bouton d'upload) → bouton « Reprendre une photo » (`components/correction-copie.tsx`).
- Note recalculée à partir du détail par question (l'IA ne garantit pas la somme), bornée à 0–20 ; points par question bornés ; CSV avec virgule décimale (Excel FR) ; clés React robustes aux homonymes.
- Sécurité (Server Actions = endpoints publics) : `grade-copy.ts` n'accepte qu'une image `data:` ≤ 8 Mo ; `generate-rapidos.ts` borne `nb` à 20 (sinon appels Mistral illimités).
- Hook SessionStart (`.claude/settings.json`, `.claude/hooks/session-start.sh`) : `npm install` auto en session cloud.
- Vérifié : `npx tsc --noEmit`, `npm run build`, test Playwright (édition conserve le détail, bouton « Reprendre une photo » après erreur).
- Prochaine étape : aucune authentification sur l'app déployée → n'importe qui connaissant l'URL peut consommer le crédit Mistral. Ajouter un code d'accès (middleware) avant diffusion.

### 2026-09-24 — Codex
- Dossier synchronisé avec GitHub sur `master` (`66d0949`) ; modifications locales conservées.
- Fichiers synchronisés : `app/actions/generate-content.ts`, `app/actions/generate-rapidos.ts`, `app/globals.css`, `components/generateur-cards.tsx`, `lib/markdown.ts`. Journaux `CLAUDE.md` et `AGENTS.md` actualisés.
- Vérification : `npm run build` réussi. Prochaine étape : aucune pour la synchronisation.

### 2026-09-24 — Codex — Diagnostic Mistral
- Vérification du code IA et du dernier déploiement GitHub/Vercel. Correction : le forfait consulté concernait un autre compte Mistral que celui de la clé de l'application. La cause de l'erreur reste à confirmer ; accès Vercel non connecté et clé locale absente.
- Fichiers touchés : `CLAUDE.md`, `AGENTS.md`. Prochaine étape : lire le message exact et vérifier la clé prise en compte par le déploiement Vercel.

### 2026-09-24 — Codex — Correction du compte à diagnostiquer
- Jonathan confirme que la clé de l'application appartient au compte Mistral « valembroise ». Le contrôle précédent du forfait ne s'applique pas à ce compte.
- Fichiers touchés : `CLAUDE.md`, `AGENTS.md`. Prochaine étape : poursuivre le diagnostic dans la session du compte cible après vérification de son identité.

# Communication & Output Rules

- Verbosity: Minimal. Do not comment on what you plan to do, what you are checking, or what you just did.
- Silent tool execution: Run all commands, edits, and checks silently without narration or intermediate step summaries.
- No conversational filler, greetings, or conclusions.
- Output contract:
  - If the task is completed without direct requested text output, reply ONLY: "Terminé."
  - If code, diff, or specific data is requested, return ONLY that raw output without introductory or concluding prose.
  - If a command or check fails, output ONLY the exact error and root cause.
