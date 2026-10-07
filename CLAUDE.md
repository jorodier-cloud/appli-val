# Instructions pour les agents (Claude Code, Codex, ChatGPT)

## Style de réponse
- Interdiction absolue de bavarder : pas de phrases de transition (« Je fais x... », « Bon... », « Poussons vers... », « Maintenant... », etc.).
- Ultra-concis. N'afficher que les erreurs et les questions bloquantes.
- Exécuter directement plutôt que d'annoncer ce qui va être fait.
- Cette règle s'applique à tous les agents (Claude Code, Codex, ChatGPT Work).

## Mémoire et synchronisation
- **Au début de chaque tâche :** lire attentivement l'ensemble de ce fichier et son historique.
- **À la fin de chaque tâche :** mettre systématiquement à jour la section « Journal de bord » ci-dessous en indiquant la date, l'agent utilisé (Claude ou Codex), un résumé court des actions réalisées, les fichiers touchés et les étapes suivantes.

## Journal de bord

### 2026-10-07 — Claude — Code d'accès
- Ajout d'un code d'accès (`middleware.ts`, `lib/acces.ts`, `app/acces/page.tsx`, `app/api/acces/route.ts`) : pages et Server Actions protégées (POST sans cookie = 401), cookie HttpOnly de 90 jours contenant une empreinte du code, jamais le code.
- Actif seulement si la variable `ACCESS_CODE` est définie dans Vercel ; sans elle, l'app reste ouverte comme avant.
- Vérifié : `npx tsc --noEmit`, `npm run build`, essais locaux (redirection vers /acces, 401 sur POST, mauvais code refusé, bon code accepté, icônes publiques servies, app ouverte sans variable).
- Prochaine étape : Jonathan ajoute `ACCESS_CODE` dans Vercel (Settings → Environment Variables, Production) puis redéploie.
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

### 2026-09-28 — Claude — Correction de copie par photo (vision Mistral)
- Ajout du module manquant décrit au §3.7 du cahier des charges (photo de copie → correction IA →
  note/feedback), qui n'existait pas dans le code malgré ce que dit CAHIER_DES_CHARGES.md : intégré
  dans le module Évaluations existant plutôt qu'en module séparé (décision validée avec Jonathan),
  avec Mistral vision serveur EU (cohérent avec l'existant et le RGPD déjà acté).
- Nouveau : `app/actions/grade-copy.ts` (appel `callMistralStructured` avec image + schéma Zod strict
  studentName/isReadable/totalScore/breakdown/generalFeedback), `components/correction-copie.tsx`
  (upload photo, relecture/édition de la note et du détail par question avant validation, tableau des
  copies avec moyenne/min/max, export CSV).
- Modifiés : `types/evaluation.ts` (breakdown + appréciation sur `NoteEleve`), `lib/store.ts`
  (`upsertCorrection`, rapprochement par nom), `components/evaluations-manager.tsx` (intégration du
  composant, suppression du bloc moyenne devenu redondant).
- Vérifié : `npx tsc --noEmit` et `npm run build` OK. UI testée dans le navigateur intégré avec des
  données injectées en `localStorage` (pas de champ de saisie fichier disponible dans cet outil) :
  tableau/expand, bouton « Corriger une copie », export CSV fonctionnels. Pas de clé
  `MISTRAL_API_KEY` en local : l'appel IA réel (upload photo → réponse structurée) n'a pas pu être
  vérifié de bout en bout, seul le chemin d'erreur générique (clé manquante) est garanti par le code
  partagé déjà utilisé ailleurs.
- Prochaine étape : tester l'appel vision avec une vraie clé et une vraie photo de copie avant usage
  réel ; envisager de relier ce module à une vraie base de données si l'usage se confirme (voir §5 du
  cahier des charges).

### 2026-09-25 — Codex — Règles de communication
- Bloc « Communication & Output Rules » ajouté à AGENTS.md. Fichiers : AGENTS.md, CLAUDE.md. Prochaine étape : aucune.


### 2026-09-24 — Codex
- Mise à jour du dossier depuis GitHub sur `master`, commit `66d0949` (7 commits intégrés depuis la branche locale précédente).
- Fichiers synchronisés : `app/actions/generate-content.ts`, `app/actions/generate-rapidos.ts`, `app/globals.css`, `components/generateur-cards.tsx`, `lib/markdown.ts`.
- Modifications locales de `CLAUDE.md` et `AGENTS.md` conservées ; journaux actualisés. Dépendances inchangées.
- Vérification : `npm run build` réussi, contrôle des types et génération des 9 pages inclus.
- Prochaine étape : aucune action nécessaire pour la synchronisation.

### 2026-09-24 — Codex — Diagnostic Mistral
- Lecture des appels IA et de la gestion des erreurs : modèle `mistral-medium-latest`, serveur `eu`, erreur HTTP 429 traduite en limite de requêtes. Le texte « crédit épuisé » ne figure pas dans le code local.
- Correction après vérification de l'identité : la console Mistral consultée était celle de Jonathan, pas le compte « valembroise » dont la clé est utilisée par l'application selon Jonathan. Les observations de forfait et de limites précédentes ne permettent aucune conclusion sur le compte cible.
- GitHub indique un déploiement réussi du commit `66d0949` le 24 septembre. La session Vercel demande une connexion ; la clé réellement utilisée en production n'a pas été vérifiée. La clé locale est absente.
- Fichiers modifiés : `CLAUDE.md`, `AGENTS.md` uniquement. Aucune correction applicative justifiée à ce stade.
- Prochaine étape : obtenir le message d'erreur exact et vérifier le déploiement associé à la nouvelle clé Vercel.

### 2026-09-24 — Codex — Correction du compte à diagnostiquer
- Compte cible confirmé par Jonathan : « valembroise ». Vérifier l'identité de la session avant tout contrôle du forfait ou de la clé.
- Fichiers modifiés : `CLAUDE.md`, `AGENTS.md`. Prochaine étape : ouvrir une session Mistral sur le compte cible pour poursuivre le diagnostic.


# Communication style
- Concision absolue : n'explique jamais ce que tu vas faire ni ce que tu as fait.
- Aucun commentaire d'étape, pas de récit intermédiaire, pas de récapitulatif.
- Exécute les commandes et les modifications d'outils en silence.
- Sortie finale : réponds uniquement par « Terminé. » ou affiche le résultat brut demandé (code, diff, lien).
- Si une commande échoue, affiche uniquement la cause exacte et l'erreur.


## Journal de bord — 7 octobre 2026 : skills par projet

Codex : aucun skill Domaine ajouté à ce dépôt. Plugins Claude Code sélectionnés pour ce projet : superpowers, diagram-design ; copies Domaine synchronisées du compte masquées selon le périmètre. Mémoire Claude et connecteurs conservés. Validation et sauvegarde : inventaire de la mission Codex du 07/10. Aucun code métier ni déploiement modifié. Suite : utiliser le dépôt correspondant à la tâche ; synchroniser les copies Domaine depuis `../_skills/domain` en cas d’évolution.
