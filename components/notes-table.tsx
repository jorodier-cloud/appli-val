"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EvaluationPicker } from "@/components/evaluation-picker";
import { useEleves, useEvaluations, useNote, upsertNote } from "@/lib/store";
import { clamp } from "@/lib/utils";
import type { Eleve, Evaluation } from "@/types/domain";

function NoteRow({ eleve, evaluation }: { eleve: Eleve; evaluation: Evaluation }) {
  const note = useNote(evaluation.id, eleve.id);
  const maxScore = evaluation.maxTotalScore;

  const [score, setScore] = useState(note?.totalScore ?? 0);
  const [maxInput, setMaxInput] = useState(maxScore ?? note?.maxTotalScore ?? 20);
  const [commentaire, setCommentaire] = useState(note?.commentaire ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setScore(note?.totalScore ?? 0);
    setCommentaire(note?.commentaire ?? "");
    if (note) setMaxInput(note.maxTotalScore);
  }, [note]);

  const effectiveMax = maxScore ?? maxInput;

  const handleSave = () => {
    upsertNote({
      evaluationId: evaluation.id,
      eleveId: eleve.id,
      totalScore: clamp(score, 0, effectiveMax),
      maxTotalScore: effectiveMax,
      source: note?.source ?? "manuel",
      correction: note?.correction ?? null,
      detectedStudentName: note?.detectedStudentName ?? null,
      commentaire,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <tr className="border-b border-line last:border-0">
      <td className="whitespace-nowrap py-2.5 pl-4 pr-4 text-sm text-ink">
        {eleve.prenom} {eleve.nom}
      </td>
      <td className="py-2.5 pr-4">
        <div className="flex items-center gap-1 text-sm">
          <input
            type="number"
            min={0}
            max={effectiveMax}
            step={0.5}
            value={score}
            onChange={(event) => setScore(Number(event.target.value))}
            className="w-16 rounded-md border border-line px-2 py-1 text-right text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
          />
          <span className="text-ink-soft">/</span>
          {maxScore === null ? (
            <input
              type="number"
              min={0}
              step={0.5}
              value={maxInput}
              onChange={(event) => setMaxInput(Number(event.target.value))}
              className="w-14 rounded-md border border-line px-2 py-1 text-right text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
            />
          ) : (
            <span className="text-ink-soft">{maxScore}</span>
          )}
        </div>
      </td>
      <td className="py-2.5 pr-4">
        {note ? (
          <Badge tone={note.source === "ia" ? "info" : "neutral"}>
            {note.source === "ia" ? (
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> IA
              </span>
            ) : (
              "Manuel"
            )}
          </Badge>
        ) : (
          <span className="text-xs text-ink-soft">Aucune note</span>
        )}
      </td>
      <td className="py-2.5 pr-4">
        <input
          value={commentaire}
          onChange={(event) => setCommentaire(event.target.value)}
          placeholder="Commentaire…"
          className="w-full rounded-md border border-line px-2 py-1 text-sm text-ink placeholder:text-ink-soft focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        />
      </td>
      <td className="py-2.5">
        <Button variant="secondary" onClick={handleSave}>
          {saved ? <Check className="h-4 w-4 text-emerald-600" /> : "Enregistrer"}
        </Button>
      </td>
    </tr>
  );
}

export function NotesTable({ classeId }: { classeId: string }) {
  const [evaluationId, setEvaluationId] = useState<string | null>(null);

  const eleves = useEleves(classeId);
  const evaluations = useEvaluations(classeId);
  const evaluation = evaluations.find((e) => e.id === evaluationId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-line bg-card p-4">
        <EvaluationPicker classeId={classeId} value={evaluationId} onChange={setEvaluationId} />
      </div>

      {evaluation && (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-2.5">Élève</th>
                <th className="px-4 py-2.5">Note</th>
                <th className="px-4 py-2.5">Source</th>
                <th className="px-4 py-2.5">Commentaire</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {eleves.map((eleve) => (
                <NoteRow key={eleve.id} eleve={eleve} evaluation={evaluation} />
              ))}
            </tbody>
          </table>
          {eleves.length === 0 && (
            <p className="p-4 text-sm text-ink-soft">
              Aucun élève dans cette classe.
            </p>
          )}
        </div>
      )}

      {!evaluation && (
        <p className="text-sm text-ink-soft">
          Sélectionnez ou créez une évaluation pour afficher le tableau de notes.
        </p>
      )}
    </div>
  );
}
