"use client";

import { Check, FileWarning, Inbox, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ResultHeader } from "@/components/result-header";
import { QuestionCard } from "@/components/question-card";
import { CompetenceChip } from "@/components/competence-chip";
import { useCompetences } from "@/lib/store";
import type { CopyCorrectionResult } from "@/types/evaluation";

export type ResultStatus = "idle" | "loading" | "result" | "error";

interface ResultPanelProps {
  status: ResultStatus;
  errorMessage: string | null;
  aiResult: CopyCorrectionResult | null;
  eleveName: string | null;
  detectedName: string | null;
  evaluationId: string | null;
  eleveId: string | null;
  pointsAwarded: number[];
  onPointsChange: (index: number, value: number) => void;
  totalScore: number;
  comment: string;
  onCommentChange: (value: string) => void;
  canSave: boolean;
  onSave: () => void;
  justSaved: boolean;
}

export function ResultPanel({
  status,
  errorMessage,
  aiResult,
  eleveName,
  detectedName,
  evaluationId,
  eleveId,
  pointsAwarded,
  onPointsChange,
  totalScore,
  comment,
  onCommentChange,
  canSave,
  onSave,
  justSaved,
}: ResultPanelProps) {
  const competences = useCompetences(evaluationId);
  if (status === "idle") {
    return (
      <div className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line bg-white text-center text-ink-soft">
        <Inbox className="h-10 w-10" />
        <p className="text-sm">
          Téléversez une copie pour afficher la correction.
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-rose-300 bg-rose-50 p-6 text-center">
        <FileWarning className="h-10 w-10 text-rose-500" />
        <p className="text-sm font-medium text-rose-700">
          {errorMessage ?? "La correction a échoué."}
        </p>
      </div>
    );
  }

  if (!aiResult) return null;

  return (
    <div className="flex flex-col gap-4">
      <ResultHeader
        eleveName={eleveName}
        detectedName={detectedName}
        totalScore={totalScore}
        maxTotalScore={aiResult.max_total_score}
        globalConfidence={aiResult.global_confidence}
      />

      {eleveId && competences.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-white p-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Compétences — cliquer pour changer le niveau
          </span>
          <div className="flex flex-wrap gap-2">
            {competences.map((competence) => (
              <CompetenceChip key={competence.id} competence={competence} eleveId={eleveId} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {aiResult.questions.map((question, index) => (
          <QuestionCard
            key={`${question.question_number}-${index}`}
            question={question}
            pointsAwarded={pointsAwarded[index] ?? 0}
            onPointsChange={(value) => onPointsChange(index, value)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="teacher-comment"
          className="text-sm font-semibold text-ink"
        >
          Commentaire global
        </label>
        <textarea
          id="teacher-comment"
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          rows={3}
          className="resize-y rounded-lg border border-line bg-white p-3 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        />
      </div>

      <Button onClick={onSave} disabled={!canSave}>
        {justSaved ? (
          <>
            <Check className="h-4 w-4" />
            Note enregistrée
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Enregistrer la note
          </>
        )}
      </Button>
      {!canSave && (
        <p className="text-center text-xs text-ink-soft">
          Sélectionnez une classe, une évaluation et un élève pour enregistrer la
          note.
        </p>
      )}
    </div>
  );
}
