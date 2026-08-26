"use client";

import { useState } from "react";
import { ClipboardCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEvaluations, createEvaluation } from "@/lib/store";

interface EvaluationPickerProps {
  classeId: string | null;
  value: string | null;
  onChange: (evaluationId: string | null) => void;
  /** Barème courant à reprendre pour une nouvelle évaluation (évite une double saisie). */
  defaultBareme?: string;
  disabled?: boolean;
}

export function EvaluationPicker({
  classeId,
  value,
  onChange,
  defaultBareme = "",
  disabled,
}: EvaluationPickerProps) {
  const evaluations = useEvaluations(classeId);
  const [isCreating, setIsCreating] = useState(false);
  const [titre, setTitre] = useState("");
  const [dateISO, setDateISO] = useState(() => new Date().toISOString().slice(0, 10));

  if (!classeId) {
    return (
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
          <ClipboardCheck className="h-4 w-4" />
          Évaluation
        </span>
        <p className="text-xs text-ink-soft">Choisissez d&apos;abord une classe.</p>
      </div>
    );
  }

  const handleCreate = () => {
    if (!titre.trim()) return;
    const evaluation = createEvaluation(classeId, titre, defaultBareme, dateISO);
    onChange(evaluation.id);
    setIsCreating(false);
    setTitre("");
  };

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="evaluation-picker"
        className="flex items-center gap-2 text-sm font-semibold text-ink"
      >
        <ClipboardCheck className="h-4 w-4 text-terracotta" />
        Évaluation
      </label>

      {!isCreating && (
        <div className="flex gap-2">
          <select
            id="evaluation-picker"
            value={value ?? ""}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value || null)}
            className="flex-1 rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep disabled:bg-card disabled:text-ink-soft"
          >
            <option value="">Sélectionner une évaluation…</option>
            {evaluations.map((evaluation) => (
              <option key={evaluation.id} value={evaluation.id}>
                {evaluation.titre} ({evaluation.dateISO})
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            disabled={disabled}
            onClick={() => setIsCreating(true)}
          >
            <Plus className="h-4 w-4" />
            Nouvelle
          </Button>
        </div>
      )}

      {isCreating && (
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-card p-3">
          <input
            autoFocus
            value={titre}
            onChange={(event) => setTitre(event.target.value)}
            placeholder="Titre (ex : Contrôle chapitre 3 — Théorème de Pythagore)"
            className="rounded-md border border-line bg-white p-2 text-sm text-ink placeholder:text-ink-soft focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
          />
          <input
            type="date"
            value={dateISO}
            onChange={(event) => setDateISO(event.target.value)}
            className="rounded-md border border-line bg-white p-2 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
          />
          <div className="flex gap-2">
            <Button type="button" onClick={handleCreate} disabled={!titre.trim()}>
              Créer
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
