# Instructions pour les agents (Claude Code, Codex, ChatGPT)

## Style de réponse
- Pas de phrases de transition (« Je fais x... », « Bon... ») : exécuter directement.
- Réponses courtes : le résultat et la preuve de vérification en une ligne ; poser une question seulement si elle bloque.
- Cette règle s'applique à tous les agents (Claude Code, Codex, ChatGPT Work).

## Mémoire et synchronisation
- **Au début de chaque tâche :** lire attentivement l'ensemble de ce fichier et son historique.
- **À la fin de chaque tâche :** ajouter systématiquement une entrée en tête de `JOURNAL.md` en indiquant la date, l'agent utilisé (Claude ou Codex), un résumé court des actions réalisées, les fichiers touchés et les étapes suivantes.

# Communication & Output Rules

- Verbosity: minimal. Don't narrate routine commands or checks. During a long task, give one short line when a significant step finishes or the plan changes, so Jonathan knows where things stand.
- No conversational filler, greetings, or conclusions.
- Output contract:
  - If the task is completed without direct requested text output, reply "Terminé." When a verification was run (test, build, check, deploy readback), add ONE line of proof in plain French: what was run and what came back (e.g. "Terminé. npm test : 42/42 réussis."). Never claim success without that proof; if nothing could be verified, say so in one line.
  - If code, diff, or specific data is requested, return ONLY that raw output without introductory or concluding prose.
  - If a command or check fails, output ONLY the exact error and root cause.
