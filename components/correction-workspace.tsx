"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClassePicker } from "@/components/classe-picker";
import { EvaluationPicker } from "@/components/evaluation-picker";
import { ElevePicker } from "@/components/eleve-picker";
import { CompetencesEditor } from "@/components/competences-editor";
import { GradingScaleInput } from "@/components/grading-scale-input";
import { CopyDropzone } from "@/components/copy-dropzone";
import { ResultPanel, type ResultStatus } from "@/components/result-panel";
import { correctCopy } from "@/app/actions/correct-copy";
import {
  useEleves,
  useEvaluations,
  updateEvaluationBareme,
  upsertNote,
} from "@/lib/store";
import type { ProcessedImage } from "@/lib/image";
import type { CopyCorrectionResult } from "@/types/evaluation";

export function CorrectionWorkspace() {
  const [classeId, setClasseId] = useState<string | null>(null);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [eleveId, setEleveId] = useState<string | null>(null);

  const evaluations = useEvaluations(classeId);
  const evaluation = evaluations.find((e) => e.id === evaluationId) ?? null;
  const eleves = useEleves(classeId);
  const selectedEleve = eleves.find((e) => e.id === eleveId) ?? null;

  const [gradingScale, setGradingScale] = useState("");
  const [image, setImage] = useState<ProcessedImage | null>(null);

  const [status, setStatus] = useState<ResultStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<CopyCorrectionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [justSaved, setJustSaved] = useState(false);

  // Draft éditable par le professeur — distinct de aiResult, qui reste la
  // référence immuable renvoyée par le modèle.
  const [comment, setComment] = useState("");
  const [pointsAwarded, setPointsAwarded] = useState<number[]>([]);

  // Le barème suit l'évaluation sélectionnée (chargé à la sélection, puis
  // toute modification est répercutée sur l'évaluation en base).
  useEffect(() => {
    setGradingScale(evaluation?.bareme ?? "");
  }, [evaluationId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!aiResult) return;
    setComment(aiResult.teacher_summary_comment);
    setPointsAwarded(aiResult.questions.map((q) => q.points_awarded));
  }, [aiResult]);

  const totalScore = useMemo(
    () => pointsAwarded.reduce((sum, value) => sum + value, 0),
    [pointsAwarded]
  );

  const canSubmit = Boolean(image) && gradingScale.trim().length > 0 && !isPending;
  const canSave = Boolean(aiResult && evaluationId && eleveId);

  const handleGradingScaleChange = (value: string) => {
    setGradingScale(value);
    if (evaluationId) updateEvaluationBareme(evaluationId, value);
  };

  const handleSubmit = () => {
    if (!image) return;

    setStatus("loading");
    setErrorMessage(null);

    startTransition(async () => {
      const response = await correctCopy({
        imageBase64: image.base64,
        mediaType: image.mediaType,
        gradingScale,
      });

      if (response.ok) {
        setAiResult(response.data);
        setStatus("result");
      } else {
        setAiResult(null);
        setErrorMessage(response.error);
        setStatus("error");
      }
    });
  };

  const handlePointsChange = (index: number, value: number) => {
    setPointsAwarded((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const handleSave = () => {
    if (!aiResult || !evaluationId || !eleveId) return;

    const questions = aiResult.questions.map((question, index) => ({
      ...question,
      points_awarded: pointsAwarded[index] ?? question.points_awarded,
    }));

    upsertNote({
      evaluationId,
      eleveId,
      totalScore,
      maxTotalScore: aiResult.max_total_score,
      source: "ia",
      correction: { ...aiResult, questions, teacher_summary_comment: comment },
      detectedStudentName: aiResult.student_name ?? null,
      commentaire: comment,
    });

    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);

    // Réinitialise pour la copie suivante, en gardant le contexte classe/évaluation.
    setImage(null);
    setAiResult(null);
    setStatus("idle");
    setErrorMessage(null);
    setEleveId(null);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="flex flex-col gap-5 rounded-xl border border-line bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Contexte
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ClassePicker
            value={classeId}
            onChange={(id) => {
              setClasseId(id);
              setEvaluationId(null);
              setEleveId(null);
            }}
            disabled={isPending}
          />
          <EvaluationPicker
            classeId={classeId}
            value={evaluationId}
            onChange={(id) => {
              setEvaluationId(id);
              setEleveId(null);
            }}
            defaultBareme={gradingScale}
            disabled={isPending}
          />
          <ElevePicker
            classeId={classeId}
            evaluationId={evaluationId}
            value={eleveId}
            onChange={setEleveId}
            detectedName={aiResult?.student_name}
            disabled={isPending}
          />
        </div>

        {evaluationId && <CompetencesEditor evaluationId={evaluationId} />}

        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Saisie professeur
        </h2>

        <GradingScaleInput
          value={gradingScale}
          onChange={handleGradingScaleChange}
          disabled={isPending}
        />

        <CopyDropzone
          image={image}
          onImageChange={setImage}
          disabled={isPending}
        />

        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyse en cours…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Lancer la pré-correction IA
            </>
          )}
        </Button>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Résultats &amp; validation
        </h2>
        <ResultPanel
          status={status}
          errorMessage={errorMessage}
          aiResult={aiResult}
          eleveName={selectedEleve ? `${selectedEleve.prenom} ${selectedEleve.nom}` : null}
          detectedName={aiResult?.student_name ?? null}
          evaluationId={evaluationId}
          eleveId={eleveId}
          pointsAwarded={pointsAwarded}
          onPointsChange={handlePointsChange}
          totalScore={totalScore}
          comment={comment}
          onCommentChange={setComment}
          canSave={canSave}
          onSave={handleSave}
          justSaved={justSaved}
        />
      </section>
    </div>
  );
}
