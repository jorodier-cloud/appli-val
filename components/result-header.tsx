"use client";

import { UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ResultHeaderProps {
  eleveName: string | null;
  detectedName: string | null;
  totalScore: number;
  maxTotalScore: number;
  globalConfidence: number;
}

function confidenceTone(confidence: number): "success" | "warning" | "danger" {
  if (confidence >= 0.75) return "success";
  if (confidence >= 0.5) return "warning";
  return "danger";
}

export function ResultHeader({
  eleveName,
  detectedName,
  totalScore,
  maxTotalScore,
  globalConfidence,
}: ResultHeaderProps) {
  const showDetectedHint =
    Boolean(detectedName) &&
    (!eleveName || !eleveName.toLowerCase().includes(detectedName!.toLowerCase().split(" ")[0] ?? ""));

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-white p-4">
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          <UserRound className="h-4 w-4 text-ink-soft" />
          {eleveName ?? (
            <span className="italic text-ink-soft">Aucun élève sélectionné</span>
          )}
        </span>
        {showDetectedHint && (
          <span className="pl-6 text-xs text-ink-soft">IA a lu : « {detectedName} »</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Badge tone={confidenceTone(globalConfidence)}>
          Confiance globale : {Math.round(globalConfidence * 100)}%
        </Badge>
        <span className="text-lg font-semibold text-ink">
          {totalScore.toFixed(1)}
          <span className="text-sm font-normal text-ink-soft">
            {" "}
            / {maxTotalScore} pts
          </span>
        </span>
      </div>
    </div>
  );
}
