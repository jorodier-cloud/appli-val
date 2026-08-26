"use client";

import { useState } from "react";
import { EvaluationPicker } from "@/components/evaluation-picker";
import { CompetenceChip } from "@/components/competence-chip";
import { useEleves, useEvaluations, useCompetences } from "@/lib/store";

export function CompetencesGrid({ classeId }: { classeId: string }) {
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const eleves = useEleves(classeId);
  const evaluations = useEvaluations(classeId);
  const evaluation = evaluations.find((e) => e.id === evaluationId) ?? null;
  const competences = useCompetences(evaluationId);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-line bg-card p-4">
        <EvaluationPicker classeId={classeId} value={evaluationId} onChange={setEvaluationId} />
      </div>

      {evaluation && competences.length === 0 && (
        <p className="text-sm text-ink-soft">
          Aucune compétence définie pour cette évaluation — ajoutez-en depuis
          l&apos;onglet « Évaluations &amp; correction IA ».
        </p>
      )}

      {evaluation && competences.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eleves.map((eleve) => (
            <div key={eleve.id} className="rounded-xl border border-line bg-card p-4">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-terracotta-deep">
                Élève
              </span>
              <h3 className="mb-3 text-sm font-semibold text-ink">
                {eleve.prenom} {eleve.nom}
              </h3>
              <div className="flex flex-wrap gap-2">
                {competences.map((competence) => (
                  <CompetenceChip key={competence.id} competence={competence} eleveId={eleve.id} />
                ))}
              </div>
            </div>
          ))}
          {eleves.length === 0 && (
            <p className="text-sm text-ink-soft">Aucun élève dans cette classe.</p>
          )}
        </div>
      )}

      {!evaluation && (
        <p className="text-sm text-ink-soft">
          Sélectionnez ou créez une évaluation pour afficher les compétences.
        </p>
      )}
    </div>
  );
}
