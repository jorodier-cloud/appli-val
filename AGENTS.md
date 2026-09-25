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
