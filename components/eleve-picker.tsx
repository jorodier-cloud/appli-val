"use client";

import { useEffect } from "react";
import { UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEleves, useNote } from "@/lib/store";
import { matchDetectedName } from "@/lib/name-match";

interface ElevePickerProps {
  classeId: string | null;
  evaluationId: string | null;
  value: string | null;
  onChange: (eleveId: string | null) => void;
  detectedName?: string | null;
  disabled?: boolean;
}

export function ElevePicker({
  classeId,
  evaluationId,
  value,
  onChange,
  detectedName,
  disabled,
}: ElevePickerProps) {
  const eleves = useEleves(classeId);
  const existingNote = useNote(evaluationId, value);

  useEffect(() => {
    if (value || !detectedName || eleves.length === 0) return;
    const match = matchDetectedName(detectedName, eleves);
    if (match) onChange(match.id);
  }, [detectedName, eleves, value, onChange]);

  if (!classeId) {
    return (
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
          <UserRound className="h-4 w-4" />
          Élève
        </span>
        <p className="text-xs text-ink-soft">Choisissez d&apos;abord une classe.</p>
      </div>
    );
  }

  const selected = eleves.find((e) => e.id === value) ?? null;
  const detectedDiffersFromSelection =
    Boolean(detectedName) &&
    (!selected ||
      !`${selected.prenom} ${selected.nom}`
        .toLowerCase()
        .includes(detectedName!.toLowerCase().split(" ")[0] ?? ""));

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="eleve-picker"
        className="flex items-center gap-2 text-sm font-semibold text-ink"
      >
        <UserRound className="h-4 w-4 text-terracotta" />
        Élève
      </label>
      <select
        id="eleve-picker"
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value || null)}
        className="rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep disabled:bg-card disabled:text-ink-soft"
      >
        <option value="">Sélectionner un élève…</option>
        {eleves.map((eleve) => (
          <option key={eleve.id} value={eleve.id}>
            {eleve.prenom} {eleve.nom}
          </option>
        ))}
      </select>

      {eleves.length === 0 && (
        <p className="text-xs text-ink-soft">
          Aucun élève dans cette classe — rendez-vous dans l&apos;onglet « Mes classes ».
        </p>
      )}

      {detectedDiffersFromSelection && (
        <p className="text-xs text-amber-700">IA a lu : « {detectedName} »</p>
      )}

      {existingNote && (
        <Badge tone="warning" className="w-fit">
          Déjà noté(e) : {existingNote.totalScore} / {existingNote.maxTotalScore}
        </Badge>
      )}
    </div>
  );
}
