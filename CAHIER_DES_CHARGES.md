# CAHIER DES CHARGES — EduTeach AI

> Document de cadrage complet, construit à partir de la demande d'origine.
> Objectif : lister tous les modules attendus, l'état d'avancement réel, et les points à trancher
> avant de coder la suite. Rien ici n'est figé — c'est une base de discussion.

---

## 0. État des lieux

Le dossier `appli val` contient aujourd'hui six modules fonctionnels : la correction de copies
de maths photographiées par IA vision (Mistral, serveur EU — §3.7), le socle classes/élèves avec
rattachement de la correction et tableau de notes (§3.8-3.9, Lot 1), la progression par niveau avec
questions flash générées par IA et test de réactivation automatique (§3.1-3.3, Lot 2), la génération
de contenu pédagogique par chapitre — cours, exercices, évaluation + corrigé (§3.4-3.6, Lot 3), les
onglets Gestion de classe / Vie de classe (§3.10-3.11, Lot 4), et la révision espacée J+1/J+3/J+7 en
planning exportable (§3.13, Lot 5).

L'application a été rebaptisée **Riwaq** et réorganisée (Lot Riwaq, voir §6) : les six onglets
d'origine sont regroupés en cinq sections plus lisibles — Tableau de bord (nouveau, vue d'ensemble
par classe), Mes classes (classes/élèves + notes + suivi par compétences + vie de classe, en
sous-onglets), Générateur de supports (progression, contenus générés, révision espacée), Évaluations
& correction IA (le module §3.7), et Banque de ressources (tout le contenu généré + les fiches
Gestion de classe / méthodologiques). Un suivi par compétences (échelle NA/PA/A/D, §3.9bis) a été
ajouté en complément de la note chiffrée, à la volée par évaluation.

Point ouvert §7.1 (mono-matière vs générique) : les prompts de génération restent centrés maths pour
l'instant (cohérent avec l'unique module existant à date), mais rien dans la structure de données
n'empêche d'y ajouter une matière plus tard — c'est un point encore à trancher, pas un choix déjà
figé côté modèle de données.

Tout le reste de la demande d'origine — progression, contenus pédagogiques générés, gestion de
classes/élèves, notes, onglets "Gestion de classe" / "Vie de classe", intégration ENT, révision
espacée — **reste à construire**.

Contrainte actée pour la suite : **pas de vraie base de données pour l'instant**, on continue en
prototype local (stockage navigateur / état applicatif), quitte à migrer plus tard vers une vraie
BDD. Voir §5 pour les conséquences concrètes de ce choix.

---

## 1. Vision produit

Une application pour enseignants du second degré, organisée **par niveau** et **par classe**, qui :
1. sert de colonne vertébrale pédagogique (progression → contenus → réactivation) ;
2. accélère la correction et la restitution des notes (photo → note le soir même) ;
3. outille la vie de classe (gestion de classe au quotidien, rôle de professeur principal) ;
4. automatise la révision espacée des élèves via les devoirs.

---

## 2. Utilisateurs

- **Enseignant** (tous) : accès à progression, contenus pédagogiques, classes, notes, correction IA,
  onglet "Gestion de classe".
- **Professeur principal** : en plus, accès à l'onglet "Vie de classe" pour SA classe de PP.

Pas de compte élève dans l'application : les élèves reçoivent les devoirs/révisions via l'ENT
(Pronote / École Directe), pas via un accès direct à l'app (à confirmer, voir §7).

---

## 3. Modules fonctionnels

### 3.1 Progression pédagogique par niveau
Saisie, par niveau (ex. 3e, 2nde), d'une progression annuelle : liste ordonnée de chapitres/séquences,
avec dates prévisionnelles de séance. C'est la colonne vertébrale : les questions flash, le test de
réactivation, et la révision espacée s'appuient tous sur cette progression datée.

### 3.2 Questions flash
Pour chaque niveau, génération IA de petites questions rapides à poser en début de séance, liées au
chapitre courant de la progression. Banque cumulative au fil de l'année (nécessaire pour le §3.3).

### 3.3 Test de réactivation (tous les 10 séances)
Génère automatiquement, tous les 10 séances, un test court qui pioche dans les questions flash déjà
posées depuis le début de l'année — logique de réactivation, pas de nouveau contenu.

### 3.4 Support de cours (synthèse)
Pour chaque chapitre/séquence : génération IA d'un support de cours structuré, avec toutes les
propriétés et définitions clairement encadrées — une vraie synthèse, pas un brouillon de notes.

### 3.5 Fiches d'exercices progressives
Pour chaque chapitre/séquence : génération d'exercices gradués — application directe, exercices
complémentaires type problème, exercices plus complexes, démonstrations. Doit rester cohérent avec
le support de cours du même chapitre (mêmes notations, mêmes prérequis).

### 3.6 Évaluation progressive + corrigé
Pour chaque chapitre/séquence : génération d'une évaluation à difficulté progressive, alignée sur les
fiches d'exercices, **et** génération automatique de son corrigé détaillé.

### 3.7 Correction de copies photographiées par IA — ✅ déjà prototypé
**Ce qui existe** : le prof saisit un barème texte, dépose une photo de copie manuscrite ; l'IA
(Mistral vision, région EU) renvoie une pré-correction structurée — note par question, transcription
LaTeX, classification des erreurs (calcul / méthode / syntaxe / justification manquante), détection
des ratures, feedback pas à pas. Le prof édite tout avant validation. Cas illisible géré
(`is_readable: false` → le prof corrige lui-même).

**Ce qui manque pour atteindre l'objectif d'origine** ("note le soir même, restitution le
lendemain") :
- rattacher une copie à un **élève réel** d'une **classe réelle** (aujourd'hui : aucune notion de
  classe/élève dans le code, tout est en mémoire, une copie à la fois) ;
- rattacher la correction à une **évaluation** identifiée (celle du §3.6, ou saisie manuelle) ;
- persister le résultat pour qu'il alimente le tableau de notes (§3.9).

### 3.8 Gestion des classes et élèves
Créer des classes par niveau, saisir la liste des élèves par classe. Brique nécessaire pour rattacher
notes, copies corrigées et appréciations à quelqu'un de réel.

### 3.9 Tableau de notes
Vue par classe × évaluation, agrégeant les notes issues de la correction IA validée et des saisies
manuelles. C'est la finalité concrète du module §3.7.

### 3.9bis Suivi par compétences — ✅ ajouté (Lot Riwaq)
En complément de la note chiffrée : par évaluation, liste de compétences libres (créées par le prof),
chacune évaluée par élève sur une échelle à 4 niveaux (NA / PA / A / D — non acquis / partiellement
acquis / acquis / dépassé), affichée en grille classe × compétence. Le tableau de bord agrège un
taux moyen d'acquisition (compétences au niveau A ou D) toutes classes confondues.

### 3.10 Onglet "Gestion de classe" (tous les profs)
Espace de fiches pratiques sur la gestion de classe — **rédigées par toi**, pas générées par IA.
Techniquement : un espace de consultation/édition de fiches (créer, classer, relire), pas un moteur
IA.

### 3.11 Onglet "Vie de classe" (professeurs principaux)
- Préparation des conseils de classe (synthèse par élève : moyennes, tendances, points d'alerte).
- Bilan du conseil de classe (compte-rendu structuré).
- Fiches méthodologiques "apprendre à apprendre" (même logique que §3.10, ou génération IA).
- Synthèses d'appréciations avant chaque conseil de classe, pour la classe dont le prof est PP —
  **point ouvert** : ça suppose d'agréger les appréciations/notes saisies par les *collègues* sur les
  mêmes élèves. Sans connexion à l'ENT (§3.12), l'app n'a pas accès aux données des autres profs qui
  ne l'utilisent pas eux-mêmes. Voir §7.

### 3.12 Intégration ENT (Pronote / École Directe)
Objectif : pousser automatiquement contenus de séance et devoirs vers l'ENT utilisé par
l'établissement.

**Point dur identifié** : ni Pronote (Index Éducation) ni École Directe n'exposent d'API publique
ouverte permettant à une application tierce d'écrire des données (cahier de textes, devoirs) sans
accord d'intégration officiel avec l'éditeur. C'est un chantier à part entière, avec un risque
technique et juridique réel — pas une simple case à cocher. À traiter comme un lot exploratoire (§6),
avec un repli réaliste : générer un texte prêt à copier-coller dans le cahier de textes existant,
plutôt qu'une écriture automatique.

### 3.13 Révision espacée automatisée (J+1 / J+3 / J+7)
Pour chaque séance datée dans la progression, planifier automatiquement trois rappels :
- **J+1** : 3-4 questions sur le cours (sans regarder, puis vérification) + 2 exercices d'application.
- **J+3** : même logique, autres questions/exercices.
- **J+7** : même logique, autres questions/exercices.

Dépend directement de §3.12 pour la diffusion réelle aux élèves (devoirs du soir dans l'ENT). En
repli sans intégration ENT : l'app génère un planning de révision exportable que le prof colle
lui-même dans le cahier de textes.

---

## 4. Entités principales (modèle de données pressenti)

- **Enseignant** — identité, niveaux enseignés, classes dont il est PP.
- **Niveau** (ex. 3e, 2nde) — rattaché à une progression.
- **Progression** — liste ordonnée de Chapitres/Séquences avec dates.
- **Chapitre / Séquence** — support de cours, fiches d'exercices, évaluation + corrigé associés.
- **Classe** — rattachée à un niveau, liste d'Élèves, un enseignant "principal" optionnel.
- **Élève** — rattaché à une Classe.
- **Évaluation** — rattachée à un Chapitre et une Classe ; liste de Notes.
- **Copie** — image + résultat de correction IA, rattachée à un Élève + une Évaluation.
- **Note** — Élève × Évaluation × valeur (issue d'une Copie ou saisie manuelle).
- **QuestionFlash** — rattachée à un Niveau/Chapitre, banque cumulative.
- **RévisionItem** — Séance × échéance (J+1/J+3/J+7) × contenu (questions + exercices).
- **FicheGestionClasse / FicheVieDeClasse** — contenu texte, rédigé ou généré, classé par thème.

---

## 5. Conséquences du choix "pas de vraie BDD pour l'instant"

- Prototype **mono-appareil, mono-navigateur** : les données (classes, élèves, notes, progression)
  vivent en `localStorage` ou en mémoire — vidage du cache = perte de données.
- Pas de compte multi-utilisateur ni de synchronisation entre appareils (utile en salle des profs vs
  à la maison).
- Acceptable pour valider les parcours et l'ergonomie de chaque module, **pas** pour un usage réel en
  établissement sur la durée — la migration vers une vraie base (et donc un vrai hébergement, avec
  la contrainte RGPD déjà actée pour Mistral en région EU) sera nécessaire avant tout usage avec de
  vraies données d'élèves mineurs.

---

## 6. Roadmap proposée par lots

- **Lot 0 (fait)** — Correction IA de copie, isolée, sans notion de classe.
- **Lot 1 (fait)** — Socle classes/élèves (§3.8) + rattachement du module de correction à une classe
  et une évaluation réelles + tableau de notes (§3.9). C'est le lot qui rend concret l'objectif "note
  le soir même". Persistance `localStorage` (§5) : onglets Classes / Correction / Notes, création
  d'évaluation à la volée, rapprochement automatique élève ↔ nom détecté par l'IA, tableau de notes
  éditable avec saisie manuelle.
- **Lot 2 (fait)** — Progression par niveau (§3.1) + questions flash générées par IA (§3.2) + test de
  réactivation automatique tous les 10 séances (§3.3). Simplification assumée : `Niveau` est une
  entité à part, pas encore reliée à `Classe` (texte libre depuis le Lot 1) — la connexion sera faite
  quand un lot en aura réellement besoin (génération de contenu ou diffusion).
- **Lot 3 (fait)** — Génération de contenu pédagogique par chapitre : support de cours structuré en
  blocs typés définition/propriété/théorème/exemple/remarque, clairement encadrés à l'affichage
  (§3.4) ; fiche d'exercices progressive à 4 niveaux, générée à partir du support de cours pour
  garder les mêmes notations (§3.5) ; évaluation à difficulté progressive + corrigé détaillé, alignée
  sur la fiche d'exercices (§3.6). Chaîne de génération : cours → exercices → évaluation, chaque étape
  réutilisant le contenu de la précédente comme contexte du prompt IA.
- **Lot 4 (fait)** — Onglet "Gestion de classe" (§3.10) : fiches pratiques rédigées par le prof
  (texte libre classé par thème, pas de génération IA — conforme à la demande). Onglet "Vie de
  classe" (§3.11, hors synthèses multi-profs qui dépendent de l'ENT) : synthèse par élève (moyenne,
  tendance, alerte) calculée à partir des notes déjà saisies, bilan de conseil de classe structuré
  (points positifs / vigilance / décisions), et fiches méthodologiques "apprendre à apprendre" (même
  mécanique de fiches que §3.10, réutilisée). Simplification assumée : pas de distinction de rôle
  "professeur principal" dans l'app (prototype mono-utilisateur, sans authentification) — l'onglet
  Vie de classe est accessible pour n'importe quelle classe, la restriction par rôle n'a de sens que
  quand l'app aura plusieurs comptes.
- **Lot 5 (fait)** — Révision espacée J+1/J+3/J+7 (§3.13), en mode "planning exportable" puisque
  l'ENT n'est pas connecté (Lot 6 non fait). Par chapitre : le planning pioche, sans nouvel appel IA,
  dans le contenu déjà généré pour ce chapitre (banque de questions flash du §3.2, exercices
  "application" de la fiche du §3.5), réparti sans chevauchement entre les 3 échéances datées à
  J+1/J+3/J+7 de la séance. Chaque échéance est exportée en texte prêt à coller dans le cahier de
  textes (zone de texte + bouton copier). Répond à l'ouvert §7.3 : copier-coller assisté, retenu comme
  repli concret.
- **Lot Riwaq (fait)** — Rebranding et refonte de l'IA (pas un lot fonctionnel du §3, mais un
  chantier UX à part entière) : renommage de l'app en « Riwaq », consolidation des six onglets
  d'origine en cinq sections (Tableau de bord / Mes classes / Générateur de supports / Évaluations
  & correction IA / Banque de ressources — voir §0), ajout d'un tableau de bord d'accueil
  (`lib/dashboard.ts`, `components/dashboard.tsx` — progression par classe, effectif, élèves sans
  note, raccourci « reprendre où vous en étiez ») et ajout du suivi par compétences (§3.9bis).
- **Lot 6 (exploratoire, risque élevé)** — Intégration ENT (§3.12).

---

## 7. Points ouverts à trancher ensemble

1. Une seule matière (maths) pour l'instant, ou l'app doit-elle rester générique multi-matières dès
   la conception des modules de contenu (§3.4-3.6) ?
2. §3.11 (synthèses d'appréciation avant conseil de classe) suppose des données venant des collègues :
   qui les saisit, et où, si l'app n'est pas utilisée par toute la salle des profs ?
3. ~~Diffusion aux élèves des devoirs/révisions (§3.13) en l'absence d'intégration ENT : export PDF,
   copier-coller assisté, ou autre format concret ?~~ Tranché par défaut au Lot 5 : copier-coller
   assisté (zone de texte + bouton copier par échéance), pas d'export PDF — plus simple à produire et
   suffisant pour coller dans un cahier de textes existant. À revoir si un usage réel montre le besoin
   d'un vrai PDF.
4. ~~Pour §3.10/3.11, les fiches que tu rédiges toi-même : simple zone de texte/markdown dans l'app,
   ou import de documents existants (Word/PDF) ?~~ Tranché par défaut au Lot 4 : simple zone de texte
   libre dans l'app (pas d'import Word/PDF, non demandé explicitement et bien plus lourd à construire)
   — à revoir si l'import de documents existants s'avère nécessaire en usage réel.
5. ~~Which niveau(x) et matière(s) prioriser pour le premier chapitre témoin du Lot 3 ?~~ Tranché par
   défaut au Lot 3 : maths, cohérent avec l'unique module existant à date (voir aussi point 1
   ci-dessus, toujours ouvert pour la généralisation multi-matières).

---

*État au Lot Riwaq fait : Lots 0 à 5 + Lot Riwaq (rebranding, refonte de l'IA, suivi par
compétences) construits et vérifiés en local. Reste : Lot 6 (intégration ENT, exploratoire, risque
technique et juridique réel — voir §3.12 ; à noter que son repli réaliste, le copier-coller assisté,
est déjà livré depuis le Lot 5). Les points ouverts 1 et 2 restent à trancher ; ils ne bloquent pas
le Lot 6 mais méritent discussion avant tout usage réel en établissement.*
