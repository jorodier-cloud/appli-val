"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertCircle, Loader2, Plus, Sparkles, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Latex } from "@/components/ui/latex";
import { NiveauPicker } from "@/components/niveau-picker";
import {
  useNiveaux,
  useProgression,
  useQuestionsFlash,
  useQuestionsFlashForChapitre,
  useTestsReactivation,
  addProgressionItem,
  removeProgressionItem,
  addQuestionsFlash,
  removeQuestionFlash,
  createTestReactivation,
} from "@/lib/store";
import { nextPendingSeanceMilestone, pickReactivationQuestions } from "@/lib/reactivation";
import { generateFlashQuestions } from "@/app/actions/generate-flash-questions";
import {
  CourseSummaryBlock,
  ExerciseSheetBlock,
  EvaluationBlock,
  RevisionPlanBlock,
} from "@/components/chapitre-content-blocks";
import type { ProgressionItem, QuestionFlash } from "@/types/pedagogie";

function NewProgressionItemForm({ niveauId }: { niveauId: string }) {
  const [titre, setTitre] = useState("");
  const [dateISO, setDateISO] = useState(() => new Date().toISOString().slice(0, 10));

  const handleSubmit = () => {
    if (!titre.trim()) return;
    addProgressionItem(niveauId, titre, dateISO);
    setTitre("");
  };

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-card p-4">
      <div className="flex flex-1 min-w-[16rem] flex-col gap-1">
        <label htmlFor="new-item-titre" className="text-xs font-medium text-ink-soft">
          Titre du chapitre / de la séquence
        </label>
        <input
          id="new-item-titre"
          value={titre}
          onChange={(event) => setTitre(event.target.value)}
          placeholder="Ex : Théorème de Pythagore"
          className="rounded-md border border-line bg-white p-2 text-sm text-ink placeholder:text-ink-soft focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="new-item-date" className="text-xs font-medium text-ink-soft">
          Date prévisionnelle
        </label>
        <input
          id="new-item-date"
          type="date"
          value={dateISO}
          onChange={(event) => setDateISO(event.target.value)}
          className="rounded-md border border-line bg-white p-2 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        />
      </div>
      <Button onClick={handleSubmit} disabled={!titre.trim()}>
        <Plus className="h-4 w-4" />
        Ajouter à la progression
      </Button>
    </div>
  );
}

function FlashQuestionsBlock({
  niveauId,
  niveauNom,
  item,
}: {
  niveauId: string;
  niveauNom: string;
  item: ProgressionItem;
}) {
  const questions = useQuestionsFlashForChapitre(item.id);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      const response = await generateFlashQuestions({
        niveauNom,
        chapitreTitre: item.titre,
        count: 4,
      });
      if (response.ok) {
        addQuestionsFlash(niveauId, item.id, response.questions);
      } else {
        setError(response.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Questions flash ({questions.length})
        </span>
        <Button variant="secondary" onClick={handleGenerate} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          Générer 4 questions
        </Button>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-rose-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {questions.length > 0 && (
        <ul className="flex flex-col gap-2">
          {questions.map((question) => (
            <li
              key={question.id}
              className="flex items-start justify-between gap-2 rounded-md bg-card p-2.5 text-sm"
            >
              <div className="flex flex-col gap-1">
                <span className="text-ink">
                  <Latex>{question.enonce}</Latex>
                </span>
                <span className="text-xs text-ink-soft">
                  Réponse : <Latex>{question.reponse}</Latex>
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeQuestionFlash(question.id)}
                className="shrink-0 rounded-md p-1 text-ink-soft hover:bg-rose-50 hover:text-rose-600"
                aria-label="Supprimer cette question flash"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProgressionItemCard({
  niveauId,
  niveauNom,
  item,
}: {
  niveauId: string;
  niveauNom: string;
  item: ProgressionItem;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-terracotta">
            Séance {item.ordre}
          </span>
          <h3 className="text-sm font-semibold text-ink">{item.titre}</h3>
          <p className="text-xs text-ink-soft">{item.dateISO}</p>
        </div>
        <button
          type="button"
          onClick={() => removeProgressionItem(item.id)}
          className="rounded-md p-1.5 text-ink-soft hover:bg-rose-50 hover:text-rose-600"
          aria-label={`Supprimer ${item.titre}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <FlashQuestionsBlock niveauId={niveauId} niveauNom={niveauNom} item={item} />
      <CourseSummaryBlock niveauNom={niveauNom} item={item} />
      <ExerciseSheetBlock niveauNom={niveauNom} item={item} />
      <EvaluationBlock niveauNom={niveauNom} item={item} />
      <RevisionPlanBlock item={item} />
    </div>
  );
}

function ReactivationSection({ niveauId }: { niveauId: string }) {
  const progression = useProgression(niveauId);
  const questionsFlash = useQuestionsFlash(niveauId);
  const tests = useTestsReactivation(niveauId);
  const [visibleAnswers, setVisibleAnswers] = useState<Set<string>>(new Set());

  const ordreByItemId = useMemo(() => {
    const map = new Map<string, number>();
    progression.forEach((item) => map.set(item.id, item.ordre));
    return map;
  }, [progression]);

  const questionById = useMemo(() => {
    const map = new Map<string, QuestionFlash>();
    questionsFlash.forEach((q) => map.set(q.id, q));
    return map;
  }, [questionsFlash]);

  const milestone = useMemo(
    () => nextPendingSeanceMilestone(progression.length, tests),
    [progression.length, tests]
  );

  const handleGenerateTest = () => {
    if (milestone === null) return;
    const eligiblePool = questionsFlash.filter(
      (q) => (ordreByItemId.get(q.progressionItemId) ?? Infinity) <= milestone
    );
    const picked = pickReactivationQuestions(eligiblePool, 8);
    createTestReactivation(
      niveauId,
      milestone,
      picked.map((q) => q.id)
    );
  };

  const toggleAnswers = (testId: string) => {
    setVisibleAnswers((current) => {
      const next = new Set(current);
      if (next.has(testId)) next.delete(testId);
      else next.add(testId);
      return next;
    });
  };

  if (progression.length < 10 && tests.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
        Tests de réactivation
      </h2>

      {milestone !== null && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-terracotta/10 p-4">
          <div className="flex items-center gap-2 text-sm text-indigo-900">
            <Zap className="h-4 w-4" />
            Séance {milestone} atteinte — un test de réactivation peut être généré.
          </div>
          <Button onClick={handleGenerateTest}>Générer le test</Button>
        </div>
      )}

      {tests.map((test) => (
        <div key={test.id} className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">
              Test de réactivation — séance {test.seance}
            </h3>
            <Button variant="ghost" onClick={() => toggleAnswers(test.id)}>
              {visibleAnswers.has(test.id) ? "Masquer les réponses" : "Afficher les réponses"}
            </Button>
          </div>
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-ink">
            {test.questionIds.map((questionId) => {
              const question = questionById.get(questionId);
              if (!question) return null;
              return (
                <li key={questionId}>
                  <Latex>{question.enonce}</Latex>
                  {visibleAnswers.has(test.id) && (
                    <div className="text-xs text-ink-soft">
                      Réponse : <Latex>{question.reponse}</Latex>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}

export function ProgressionManager() {
  const niveaux = useNiveaux();
  const [niveauId, setNiveauId] = useState<string | null>(null);
  const progression = useProgression(niveauId);
  const niveau = niveaux.find((n) => n.id === niveauId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <NiveauPicker value={niveauId} onChange={setNiveauId} />

      {niveauId && niveau && (
        <>
          <NewProgressionItemForm niveauId={niveauId} />

          {progression.length === 0 ? (
            <p className="text-sm text-ink-soft">
              Aucun chapitre dans la progression de {niveau.nom} pour l&apos;instant.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
                Progression — {niveau.nom}
              </h2>
              {progression.map((item) => (
                <ProgressionItemCard
                  key={item.id}
                  niveauId={niveauId}
                  niveauNom={niveau.nom}
                  item={item}
                />
              ))}
            </div>
          )}

          <Badge tone="info" className="w-fit">
            {progression.length} séance{progression.length !== 1 ? "s" : ""} au total
          </Badge>

          <ReactivationSection niveauId={niveauId} />
        </>
      )}
    </div>
  );
}
