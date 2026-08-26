# PLAN D'EXÉCUTION — EduTeach AI (Module Maths)

> Document de handoff. Aucune ligne de code applicatif ici : uniquement les décisions
> d'architecture, les contrats et l'ordre de génération.
> Source du besoin : `PROMPT_BUILD_PROTOTYPE.md`.

---

## 0. État des lieux

- Répertoire vide (aucun `package.json`, pas de dépôt git).
- Node v24.18.0 / npm 11.16.0 → compatible Next 15 + React 19.
- Génération 100 % from scratch, sans `create-next-app` : scaffolding manuel = déterministe,
  pas de CLI interactive, pas de fichiers parasites.

---

## 1. Versions figées (vérifiées sur le registre npm)

| Package | Version | Rôle |
|---|---|---|
| `next` | `15.5.23` | App Router (le prompt impose Next **15**, pas 16) |
| `react` / `react-dom` | `19.2.x` | React 19 |
| `typescript` | `^5` | mode strict |
| `@mistralai/mistralai` | `^2.6.4` | client vision (serveur **EU**, exigence RGPD) |
| `zod` | `^4.4.3` | schéma structuré (peer dep du SDK : `^3.25` ou `^4`) ✅ |
| `katex` | `^0.18.4` | moteur de rendu |
| `react-katex` | `^3.1.0` | peerDeps `react: ">=15.3.2 <20"` → **React 19 OK, pas de `--legacy-peer-deps`** |
| `@types/react-katex` | `^3.0.4` (dev) | `react-katex` n'embarque **pas** ses types |
| `tailwindcss` + `@tailwindcss/postcss` | `^4.3.3` | Tailwind v4 (config CSS-first, pas de `tailwind.config.js`) |
| `lucide-react` | `^1.33.0` | icônes |
| `clsx` + `tailwind-merge` | `^2.1.1` / `^3.6.0` | helper `cn()` |

**Décision shadcn/ui : NON.** Le prompt autorise l'alternative (« ou Lucide Icons + classes
utilitaires »). shadcn impose un `init` CLI interactif et un `components.json` → non
déterministe en génération automatique. On produit 4 primitives maison dans `components/ui/`.

`prop-types` est une peer dep de `react-katex` : auto-installée par npm ≥ 7, pas de déclaration explicite.

---

## 2. Arborescence validée

```
appli val/
├── package.json                        # deps figées ci-dessus + scripts
├── tsconfig.json                       # strict: true, paths "@/*" -> "./*"
├── next.config.ts                      # ⚠ bodySizeLimit (voir §5)
├── postcss.config.mjs                  # { "@tailwindcss/postcss": {} }
├── .env.local.example                  # MISTRAL_API_KEY=
├── .gitignore
├── README.md                           # install + run + clé API
│
├── types/
│   └── evaluation.ts                   # interfaces VERBATIM du prompt (contrat figé)
│
├── lib/
│   ├── utils.ts                        # cn() = twMerge(clsx(...))
│   ├── evaluation-schema.ts            # schéma Zod ↔ types/evaluation.ts
│   └── image.ts                        # (client) File -> downscale -> base64
│
├── app/
│   ├── layout.tsx                      # metadata + import 'katex/dist/katex.min.css'
│   ├── globals.css                     # @import "tailwindcss";
│   ├── page.tsx                        # Server Component : shell + <CorrectionWorkspace/>
│   └── actions/
│       └── correct-copy.ts             # 'use server' — Server Action (chemin imposé)
│
└── components/
    ├── correction-workspace.tsx        # 'use client' — état partagé + grille 2 colonnes
    ├── grading-scale-input.tsx         # colonne G : textarea barème
    ├── copy-dropzone.tsx               # colonne G : drop/upload + prévisualisation
    ├── result-panel.tsx                # colonne D : switch idle | loading | error | result
    ├── result-header.tsx               # nom élève éditable, note, badge confiance
    ├── question-card.tsx               # une question : LaTeX, points éditables, badges, feedback
    └── ui/
        ├── button.tsx
        ├── badge.tsx
        ├── skeleton.tsx
        └── latex.tsx                   # wrapper react-katex tolérant aux erreurs
```

**Note App Router :** `app/actions/correct-copy.ts` ne crée aucune route — seuls `page.tsx`,
`route.ts` et `layout.tsx` sont routables. Le chemin imposé par le prompt est donc valide tel quel.

---

## 3. Contrats

### 3.1 `types/evaluation.ts`
Recopié **mot pour mot** depuis `PROMPT_BUILD_PROTOTYPE.md` §2. C'est le contrat public.

### 3.2 `lib/evaluation-schema.ts`
Schéma Zod **structurellement compatible** avec les interfaces, avec 3 adaptations imposées
par le JSON Schema strict (`response_format: json_schema` façon OpenAI/Mistral) :

- **`z.strictObject(...)` et non `z.object(...)`** — génère `additionalProperties: false` dans
  le JSON Schema produit par `z.toJSONSchema()`, requis par le mode `strict: true` de Mistral.
- **`.nullable()` et non `.optional()`** pour `crossed_out_summary` et `student_name`.
  Le JSON Schema strict exige toutes les clés dans `required` : une clé absente n'est pas
  modélisable, une clé à `null` l'est. Les interfaces TS restent `?: string | null` → compatibles.
- **Pas de `.min()` / `.max()` sur les confiances ni sur les points.** Comportement des
  contraintes numériques non garanti de façon homogène selon les fournisseurs de Structured
  Outputs → schéma permissif + **clamp applicatif** `[0,1]` et `[0, max_points]` après réception,
  dans la Server Action (défense en profondeur, indépendante du fournisseur).

### 3.3 Server Action — signature

```ts
// app/actions/correct-copy.ts
type CorrectCopyInput = {
  imageBase64: string;                          // sans le préfixe data:
  mediaType: 'image/jpeg' | 'image/png';
  gradingScale: string;                         // le barème saisi par le prof
};

type CorrectCopyResponse =
  | { ok: true;  data: CopyCorrectionResult }
  | { ok: false; error: string; fallback: CopyCorrectionResult }; // fallback.is_readable === false
```

Union discriminée → la couche UI n'a jamais à gérer un `null` ambigu.

---

## 4. Appel Mistral AI — décisions techniques

> Revirement (2026-08-24) : remplacement d'Anthropic par **Mistral AI**, à la demande explicite
> de l'utilisateur, pour des raisons de conformité RGPD (traitement des données dans l'UE).

| Point | Décision | Justification |
|---|---|---|
| Fournisseur / SDK | `@mistralai/mistralai` (v2, ESM-only) | Demande explicite RGPD |
| Région serveur | `server: 'eu'` → `https://api.eu.mistral.ai` | **C'est le point RGPD concret** : sans ce réglage explicite, le client par défaut appelle le serveur global. Vérifié dans le SDK (`README.md` § Server Selection) |
| Modèle | `mistral-medium-latest` | Modèle multimodal recommandé par la doc Mistral pour la vision (`docs.mistral.ai/capabilities/vision`) ; alias `-latest` confirmé comme convention active de l'API (plutôt qu'un snapshot daté qui sera déprécié) |
| Méthode | `client.chat.complete({ responseFormat: { type: 'json_schema', jsonSchema: { schemaDefinition, strict: true } } })`, schéma produit par `z.toJSONSchema(copyCorrectionResultSchema)` | Équivalent Mistral du Structured Outputs Anthropic utilisé initialement — garantie côté API plutôt qu'espérée du modèle |
| Vérification post-réception | `copyCorrectionResultSchema.safeParse(...)` sur le JSON parsé | Défense en profondeur : `strict: true` est une forte garantie, pas une garantie absolue |
| `maxTokens` | `16000` | Reste sous le timeout HTTP par défaut |
| Image | `{ type: 'image_url', imageUrl: 'data:<mediaType>;base64,<...>' }`, après le bloc texte | Forme confirmée dans le SDK (`imageurlchunk.ts` : accepte une data URI en chaîne brute) et dans l'exemple officiel `async_chat_with_image_no_streaming.ts` |
| System prompt | repris **verbatim** du prompt §3 | Contenu indépendant du fournisseur |

**Robustesse (le `try/catch` demandé au §3 du prompt d'origine) — 4 branches :**

1. `MISTRAL_API_KEY` absente → erreur explicite avant tout appel réseau.
2. Erreurs réseau (`ConnectionError` / `RequestTimeoutError` / `RequestAbortedError`) distinguées
   des erreurs HTTP (`MistralError.statusCode`, branché sur 401/403 auth, 429 rate limit, sinon
   message générique avec le code) — pas un `catch` unique qui écrase la distinction entre
   erreurs rejouables et définitives.
3. `finishReason === 'length' | 'model_length'` → sortie tronquée ; `finishReason === 'error'` →
   échec côté modèle. (Mistral n'a pas de `stop_reason: 'refusal'` propre à Anthropic — pas
   d'équivalent à reproduire.)
4. `content` non string, JSON invalide, ou échec du `safeParse` Zod → 3 points de sortie distincts
   avant de faire confiance à la réponse.

Toutes les branches retournent `{ ok: false, error, fallback }` avec `is_readable: false`,
conformément à l'exigence du prompt.

---

## 5. Pièges identifiés en amont

1. **Limite de body des Server Actions = 1 Mo par défaut.** Une photo de copie encodée en base64
   la dépasse systématiquement. → `next.config.ts` :
   `experimental.serverActions.bodySizeLimit: '10mb'`.
   Sans ça, le prototype échoue au premier upload réel — c'est le piège n°1 de ce projet.
2. **Redimensionnement côté client obligatoire** (`lib/image.ts`) : canvas → 1568 px sur le grand
   côté, ré-encodage JPEG q0.85. Triple gain : payload sous la limite, coût tokens réduit,
   précision vision optimale. Le base64 est purgé de son préfixe `data:image/...;base64,`.
3. **LaTeX invalide = crash React.** `SYNTAX_LATEX_ERROR` est une classification *attendue* du
   schéma : le modèle produira parfois du LaTeX cassé. `components/ui/latex.tsx` passe
   `renderError` / `errorColor` à `react-katex` → dégradation en texte brut, jamais d'écran blanc.
4. **`transcribed_latex` est mixte** (texte + `$...$`). Le wrapper découpe sur les délimiteurs
   `$...$` / `$$...$$` et n'envoie à KaTeX que les segments mathématiques.
5. **CSS KaTeX** importé une seule fois dans `app/layout.tsx` (`import 'katex/dist/katex.min.css'`),
   pas dans chaque composant.
6. **Frontière client/serveur** : `page.tsx` reste Server Component (shell `<main>` + metadata) ;
   la grille 2 colonnes et l'état vivent dans `correction-workspace.tsx` (`'use client'`), car les
   deux colonnes partagent le même état.
7. **Timeout en production** (Vercel) : `export const maxDuration = 120` depuis `app/page.tsx`.
   Sans effet en dev, indispensable au déploiement.

*Plan de repli isolé :* si `react-katex` pose problème avec React 19, seul
`components/ui/latex.tsx` est à réécrire — `katex.renderToString(..., { throwOnError: false })`
+ `dangerouslySetInnerHTML`. Le risque est confiné à un fichier.

---

## 6. Modèle d'état UI (validation prof)

Deux états distincts, jamais confondus :

- `aiResult` — la sortie IA, **immuable**, sert de référence.
- `draft` — la copie éditable par le professeur.

Champs éditables : `student_name`, `points_awarded` par question (clampé `[0, max_points]`),
`teacher_summary_comment`.

`total_score` est **dérivé** (`useMemo` sur la somme des `points_awarded` du draft), jamais stocké
dans le draft → impossible d'avoir une note désynchronisée des points saisis.

Machine à états du panneau droit : `idle` → `loading` (skeleton) → `result` | `error`,
pilotée par `useTransition` (pattern Server Action idiomatique).

---

## 7. Ordre de génération

1. `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `.gitignore`, `.env.local.example`
2. `types/evaluation.ts` (verbatim) → `lib/evaluation-schema.ts` → `lib/utils.ts`
3. `app/actions/correct-copy.ts` — le cœur, à valider avant toute UI
4. `app/globals.css`, `app/layout.tsx`
5. `components/ui/*` (button, badge, skeleton, latex)
6. `lib/image.ts`, `components/copy-dropzone.tsx`, `components/grading-scale-input.tsx`
7. `components/question-card.tsx`, `components/result-header.tsx`, `components/result-panel.tsx`
8. `components/correction-workspace.tsx`, `app/page.tsx`
9. `README.md`

---

## 8. Vérification de sortie

```bash
npm install
npx tsc --noEmit      # 0 erreur attendue (typage 100 %)
npm run build
npm run dev           # http://localhost:3000
```

Le prototype doit démarrer et afficher le placeholder sans clé API ; la clé n'est requise
qu'au clic sur « Lancer la pré-correction IA ».
