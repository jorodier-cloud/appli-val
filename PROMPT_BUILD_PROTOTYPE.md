# MISSION : BUILD PROTOTYPE - EDUTEACH AI (MATHS MODULE)

## CONTEXTE & OBJECTIF
Tu es un Senior Fullstack Engineer. Tu dois générer un prototype fonctionnel d'une application Next.js 15 (App Router) dédiée à la correction automatique de copies de mathématiques par IA vision.
Règle d'or : Code propre, typé à 100%, sans blabla, minimaliste et immédiatement exécutable.

---

## 1. TECH STACK & DEPS
- Framework : Next.js 15 (App Router, React 19, TypeScript, Server Actions)
- Styling : Tailwind CSS + shadcn/ui (ou Lucide Icons + classes utilitaires)
- Math Rendering : `katex` + `react-katex`
- AI SDK : `@anthropic-ai/sdk` (Utilisation du modèle vision principal)

---

## 2. MODÈLE DE DONNÉES & JSON SCHEMA (STRICT)

Crée un fichier `types/evaluation.ts` avec la structure suivante :

```typescript
export interface MathQuestionEval {
  question_number: string;
  question_confidence: number; // 0.0 à 1.0
  transcribed_latex: string;
  has_crossed_out_content: boolean;
  crossed_out_summary?: string | null;
  error_classification: 'NONE' | 'CALCULATION_ERROR' | 'REASONING_ERROR' | 'SYNTAX_LATEX_ERROR' | 'MISSING_UNIT_OR_JUSTIFICATION';
  points_awarded: number;
  max_points: number;
  step_by_step_feedback: string[];
}

export interface CopyCorrectionResult {
  is_readable: boolean;
  global_confidence: number;
  student_name?: string | null;
  questions: MathQuestionEval[];
  total_score: number;
  max_total_score: number;
  teacher_summary_comment: string;
}
```

---

## 3. SERVER ACTION : `app/actions/correct-copy.ts`

Crée la Server Action chargée de prendre l'image (Base64) et le barème (texte) pour appeler l'API Anthropic Vision.

### System Prompt à intégrer dans l'action :
```text
Tu es un professeur de mathématiques au collège/lycée rigoureux et bienveillant.
Ta tâche est de corriger la copie d'évaluation manuscrite fournie en image selon le barème transmitted.

Consignes impératives :
1. Distingue rigoureusement une erreur de calcul d'une erreur de méthode/démonstration.
2. Ignore le contenu raturé ou rayé pour l'attribution des points, mais mentionne-le dans 'crossed_out_summary' si pertinent.
3. Analyse le cheminement étape par étape.
4. Renvoie une transcription au format LaTeX propre (entourée de $...$ si inline) pour toute expression mathématique.
5. Évalue ton niveau de confiance (0.0 à 1.0) sur la lisibilité de l'écriture manuscrite pour chaque question.
6. Réponds STRICTEMENT et EXCLUSIVEMENT par un objet JSON valide correspondant au schéma demandé, sans aucun texte avant ou après.
```

### Exigences du code backend :
- Instancier le client `new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })`.
- Utiliser la fonction vision avec l'image passée en `image/jpeg` ou `image/png` en base64.
- Parser la réponse JSON et retourner l'objet typé `CopyCorrectionResult`.
- Gérer les erreurs de parsing JSON avec un bloc `try/catch` robuste et retourner une erreur explicite si l'image est illisible (`is_readable: false`).

---

## 4. FRONTEND / COMPOSANTS À CRÉER

### A. `app/page.tsx` (Layout Principal à 2 Colonnes)
- **Colonne Gauche (Inputs prof)** :
  - Zone de texte pour saisir le barème/consignes (ex: "Ex 1: 5pts - Résolution d'équation. Ex 2: 5pts - Théorème de Pythagore").
  - Zone de Dropzone / Upload d'image de la copie manuscrite (avec prévisualisation).
  - Bouton **"Lancer la pré-correction IA"** (State de chargement/spinner).
- **Colonne Droite (Résultats & Validation Prof)** :
  - Si aucun résultat : Placeholder "Téléversez une copie pour afficher la correction".
  - Si chargement : Skeleton screen.
  - Si résultat disponible :
    - En-tête : Nom de l'élève (éditable), Note globale (`total_score` / `max_total_score`), Badge de confiance globale.
    - Liste des questions :
      - Affichage du numéro de question, des points attribués (champ éditable par le prof).
      - Rendu LaTeX de la réponse transcrite via `react-katex`.
      - Badge de classification de l'erreur (`error_classification`).
      - Si `has_crossed_out_content` est vrai : Afficher un alerte "Ratures détectées : [summary]".
      - Liste à puces du `step_by_step_feedback`.
    - Zone de commentaire global prof (pré-remplie avec `teacher_summary_comment`, éditable).

---

## 5. CONSIGNES D'EXÉCUTION
1. Génère le fichier `package.json` avec les dépendances nécessaires (`@anthropic-ai/sdk`, `katex`, `react-katex`, `lucide-react`, `clsx`, `tailwind-merge`).
2. Génère la structure de fichiers complète.
3. Assure-toi que KaTeX importe bien ses CSS (`import 'katex/dist/katex.min.css'`).
4. Ne perds pas de temps en explications textuelles : génère directement le code des fichiers.
