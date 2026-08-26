"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompetences, createCompetence, removeCompetence } from "@/lib/store";

export function CompetencesEditor({ evaluationId }: { evaluationId: string }) {
  const competences = useCompetences(evaluationId);
  const [nom, setNom] = useState("");

  const handleAdd = () => {
    if (!nom.trim()) return;
    createCompetence(evaluationId, nom);
    setNom("");
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
        Compétences du barème
      </span>

      {competences.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {competences.map((competence) => (
            <span
              key={competence.id}
              className="flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-xs text-ink"
            >
              {competence.nom}
              <button
                type="button"
                onClick={() => removeCompetence(competence.id)}
                className="text-ink-soft hover:text-terracotta-deep"
                aria-label={`Retirer la compétence ${competence.nom}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          placeholder="Ex : Calculer une moyenne"
          className="flex-1 rounded-md border border-line bg-white p-2 text-xs text-ink placeholder:text-ink-soft focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        />
        <Button variant="secondary" onClick={handleAdd} disabled={!nom.trim()}>
          <Plus className="h-3.5 w-3.5" />
          Ajouter
        </Button>
      </div>
    </div>
  );
}
