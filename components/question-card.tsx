"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Latex } from "@/components/ui/latex";
import { clamp } from "@/lib/utils";
import type { MathQuestionEval } from "@/types/evaluation";

const CLASSIFICATION_LABEL: Record<MathQuestionEval["error_classification"], string> = {
  NONE: "Aucune erreur",
  CALCULATION_ERROR: "Erreur de calcul",
  REASONING_ERROR: "Erreur de raisonnement",
  SYNTAX_LATEX_ERROR: "Erreur de transcription",
  MISSING_UNIT_OR_JUSTIFICATION: "Unité / justification manquante",
};

const CLASSIFICATION_TONE: Record<
  MathQuestionEval["error_classification"],
  "success" | "warning" | "danger" | "neutral"
> = {
  NONE: "success",
  CALCULATION_ERROR: "danger",
  REASONING_ERROR: "danger",
  SYNTAX_LATEX_ERROR: "neutral",
  MISSING_UNIT_OR_JUSTIFICATION: "warning",
};

interface QuestionCardProps {
  question: MathQuestionEval;
  pointsAwarded: number;
  onPointsChange: (value: number) => void;
}

export function QuestionCard({
  question,
  pointsAwarded,
  onPointsChange,
}: QuestionCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">
            Question {question.question_number}
          </span>
          <Badge tone={CLASSIFICATION_TONE[question.error_classification]}>
            {CLASSIFICATION_LABEL[question.error_classification]}
          </Badge>
          {question.question_confidence < 0.6 && (
            <Badge tone="warning">Écriture peu lisible</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <input
            type="number"
            value={pointsAwarded}
            min={0}
            max={question.max_points}
            step={0.5}
            onChange={(event) =>
              onPointsChange(
                clamp(
                  Number(event.target.value),
                  0,
                  question.max_points
                )
              )
            }
            className="w-16 rounded-md border border-line px-2 py-1 text-right text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
          />
          <span className="text-ink-soft">/ {question.max_points} pts</span>
        </div>
      </div>

      <div className="rounded-md bg-card px-3 py-2 text-sm text-ink">
        <Latex>{question.transcribed_latex}</Latex>
      </div>

      {question.has_crossed_out_content && (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Ratures détectées
            {question.crossed_out_summary ? ` : ${question.crossed_out_summary}` : "."}
          </span>
        </div>
      )}

      {question.step_by_step_feedback.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
          {question.step_by_step_feedback.map((feedback, index) => (
            <li key={index}>{feedback}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
