"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Copy,
  Loader2,
  PencilRuler,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Latex } from "@/components/ui/latex";
import {
  useSupportCours,
  useFicheExercices,
  useEvaluationGeneree,
  useQuestionsFlashForChapitre,
  useRevisionPlan,
  setSupportCours,
  setFicheExercices,
  setEvaluationGeneree,
  setRevisionPlan,
} from "@/lib/store";
import { generateCourseSummary } from "@/app/actions/generate-course-summary";
import { generateExerciseSheet } from "@/app/actions/generate-exercise-sheet";
import { generateEvaluation } from "@/app/actions/generate-evaluation";
import { buildRevisionPlan, formatRevisionPlanText } from "@/lib/revision-plan";
import type { ProgressionItem } from "@/types/pedagogie";
import type { NiveauExercice, TypeBlocCours } from "@/types/contenu";

const BLOC_STYLE: Record<TypeBlocCours, string> = {
  definition: "border-sky-200 bg-sky-50",
  propriete: "border-indigo-200 bg-terracotta/10",
  theoreme: "border-amber-200 bg-amber-50",
  exemple: "border-emerald-200 bg-emerald-50",
  remarque: "border-line bg-card",
};

const BLOC_LABEL: Record<TypeBlocCours, string> = {
  definition: "Définition",
  propriete: "Propriété",
  theoreme: "Théorème",
  exemple: "Exemple",
  remarque: "Remarque",
};

const EXERCICE_NIVEAU_ORDER: NiveauExercice[] = [
  "application",
  "complementaire",
  "complexe",
  "demonstration",
];

const EXERCICE_NIVEAU_LABEL: Record<NiveauExercice, string> = {
  application: "Application directe",
  complementaire: "Exercices complémentaires",
  complexe: "Exercices complexes",
  demonstration: "Démonstrations",
};

function ErrorLine({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-rose-600">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {error}
    </p>
  );
}

interface BlockProps {
  niveauNom: string;
  item: ProgressionItem;
}

export function CourseSummaryBlock({ niveauNom, item }: BlockProps) {
  const support = useSupportCours(item.id);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      const response = await generateCourseSummary({ niveauNom, chapitreTitre: item.titre });
      if (response.ok) {
        setSupportCours(item.id, response.introduction, response.blocs);
      } else {
        setError(response.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          <BookOpen className="h-3.5 w-3.5" />
          Support de cours
        </span>
        <Button variant="secondary" onClick={handleGenerate} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {support ? "Régénérer" : "Générer le support de cours"}
        </Button>
      </div>

      <ErrorLine error={error} />

      {support && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-ink-soft">
            <Latex>{support.introduction}</Latex>
          </p>
          {support.blocs.map((bloc, index) => (
            <div
              key={index}
              className={`flex flex-col gap-1 rounded-md border p-3 text-sm ${BLOC_STYLE[bloc.type]}`}
            >
              <div className="flex items-center gap-2">
                <Badge tone="neutral">{BLOC_LABEL[bloc.type]}</Badge>
                <span className="font-semibold text-ink">{bloc.titre}</span>
              </div>
              <div className="text-ink">
                <Latex>{bloc.contenu}</Latex>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ExerciseSheetBlock({ niveauNom, item }: BlockProps) {
  const support = useSupportCours(item.id);
  const fiche = useFicheExercices(item.id);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      const response = await generateExerciseSheet({
        niveauNom,
        chapitreTitre: item.titre,
        supportCours: support
          ? { introduction: support.introduction, blocs: support.blocs }
          : null,
      });
      if (response.ok) {
        setFicheExercices(item.id, response.exercices);
      } else {
        setError(response.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          <PencilRuler className="h-3.5 w-3.5" />
          Fiche d&apos;exercices
        </span>
        <Button variant="secondary" onClick={handleGenerate} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {fiche ? "Régénérer" : "Générer la fiche d'exercices"}
        </Button>
      </div>

      {!support && !fiche && (
        <p className="text-xs text-ink-soft">
          Astuce : générez d&apos;abord le support de cours pour des exercices cohérents
          avec les mêmes notations.
        </p>
      )}

      <ErrorLine error={error} />

      {fiche && (
        <div className="flex flex-col gap-3">
          {EXERCICE_NIVEAU_ORDER.map((niveauExercice) => {
            const exercices = fiche.exercices.filter((e) => e.niveau === niveauExercice);
            if (exercices.length === 0) return null;
            return (
              <div key={niveauExercice} className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-soft">
                  {EXERCICE_NIVEAU_LABEL[niveauExercice]}
                </span>
                <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-ink">
                  {exercices.map((exercice, index) => (
                    <li key={index}>
                      <Latex>{exercice.enonce}</Latex>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function EvaluationBlock({ niveauNom, item }: BlockProps) {
  const fiche = useFicheExercices(item.id);
  const evaluation = useEvaluationGeneree(item.id);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showCorrige, setShowCorrige] = useState(false);

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      const response = await generateEvaluation({
        niveauNom,
        chapitreTitre: item.titre,
        ficheExercices: fiche?.exercices ?? null,
      });
      if (response.ok) {
        setEvaluationGeneree(item.id, response.exercices);
      } else {
        setError(response.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Évaluation + corrigé
        </span>
        <div className="flex gap-2">
          {evaluation && (
            <Button variant="ghost" onClick={() => setShowCorrige((v) => !v)}>
              {showCorrige ? "Masquer le corrigé" : "Afficher le corrigé"}
            </Button>
          )}
          <Button variant="secondary" onClick={handleGenerate} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {evaluation ? "Régénérer" : "Générer l'évaluation"}
          </Button>
        </div>
      </div>

      {!fiche && !evaluation && (
        <p className="text-xs text-ink-soft">
          Astuce : générez d&apos;abord la fiche d&apos;exercices pour une évaluation
          alignée sur le même niveau de difficulté.
        </p>
      )}

      <ErrorLine error={error} />

      {evaluation && (
        <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm text-ink">
          {evaluation.exercices.map((exercice, index) => (
            <li key={index} className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <Latex>{exercice.enonce}</Latex>
                <Badge tone="neutral" className="shrink-0">
                  {exercice.bareme}
                </Badge>
              </div>
              {showCorrige && (
                <div className="rounded-md bg-emerald-50 p-2 text-xs text-emerald-900">
                  <Latex>{exercice.corrige}</Latex>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function RevisionPlanCard({
  chapitreTitre,
  plan,
}: {
  chapitreTitre: string;
  plan: ReturnType<typeof useRevisionPlan>[number];
}) {
  const [copied, setCopied] = useState(false);
  const text = formatRevisionPlanText(chapitreTitre, plan);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Presse-papier indisponible (permissions navigateur) : le prof peut
      // toujours copier depuis la zone de texte ci-dessous.
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-line bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-soft">
          {plan.echeance} — à faire le {plan.dateISO}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-terracotta hover:text-indigo-800"
        >
          <Copy className="h-3 w-3" />
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>
      <textarea
        readOnly
        value={text}
        rows={Math.min(12, text.split("\n").length + 1)}
        className="resize-y rounded-md border border-line bg-card p-2 text-xs text-ink-soft"
        onFocus={(event) => event.currentTarget.select()}
      />
    </div>
  );
}

export function RevisionPlanBlock({ item }: { item: ProgressionItem }) {
  const questionsFlash = useQuestionsFlashForChapitre(item.id);
  const fiche = useFicheExercices(item.id);
  const plan = useRevisionPlan(item.id);

  const exercicesApplication = fiche?.exercices.filter((e) => e.niveau === "application") ?? [];
  const canGenerate = questionsFlash.length > 0 || exercicesApplication.length > 0;

  const handleGenerate = () => {
    const draft = buildRevisionPlan(item, questionsFlash, exercicesApplication);
    setRevisionPlan(item.id, draft);
  };

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          <Calendar className="h-3.5 w-3.5" />
          Révision espacée (J+1 / J+3 / J+7)
        </span>
        <Button variant="secondary" onClick={handleGenerate} disabled={!canGenerate}>
          <Sparkles className="h-3.5 w-3.5" />
          {plan.length > 0 ? "Régénérer le planning" : "Générer le planning"}
        </Button>
      </div>

      {!canGenerate && (
        <p className="text-xs text-ink-soft">
          Astuce : générez d&apos;abord des questions flash et/ou une fiche
          d&apos;exercices pour ce chapitre — le planning de révision en pioche le
          contenu, sans nouvel appel IA.
        </p>
      )}

      {plan.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {plan.map((p) => (
            <RevisionPlanCard key={p.id} chapitreTitre={item.titre} plan={p} />
          ))}
        </div>
      )}
    </div>
  );
}
