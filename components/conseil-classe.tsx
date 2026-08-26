"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Minus, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useEleves,
  useEvaluations,
  useNotesForClasse,
  useBilansConseilClasse,
  createBilanConseilClasse,
  deleteBilanConseilClasse,
} from "@/lib/store";
import { computeElevesSynthese } from "@/lib/eleve-synthese";

function TendanceIcon({ tendance }: { tendance: "hausse" | "stable" | "baisse" | null }) {
  if (tendance === "hausse") return <TrendingUp className="h-4 w-4 text-emerald-600" />;
  if (tendance === "baisse") return <TrendingDown className="h-4 w-4 text-rose-600" />;
  if (tendance === "stable") return <Minus className="h-4 w-4 text-ink-soft" />;
  return <span className="text-xs text-line">—</span>;
}

function SyntheseTable({ classeId }: { classeId: string }) {
  const eleves = useEleves(classeId);
  const evaluations = useEvaluations(classeId);
  const notes = useNotesForClasse(classeId);

  const syntheses = useMemo(
    () => computeElevesSynthese(eleves, evaluations, notes),
    [eleves, evaluations, notes]
  );

  const syntheseByEleveId = useMemo(
    () => new Map(syntheses.map((s) => [s.eleveId, s])),
    [syntheses]
  );

  if (eleves.length === 0) {
    return <p className="text-sm text-ink-soft">Aucun élève dans cette classe.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-ink-soft">
            <th className="px-4 py-2.5">Élève</th>
            <th className="px-4 py-2.5">Moyenne</th>
            <th className="px-4 py-2.5">Tendance</th>
            <th className="px-4 py-2.5">Alerte</th>
          </tr>
        </thead>
        <tbody>
          {eleves.map((eleve) => {
            const synthese = syntheseByEleveId.get(eleve.id);
            return (
              <tr key={eleve.id} className="border-b border-line last:border-0">
                <td className="whitespace-nowrap px-4 py-2.5 text-sm text-ink">
                  {eleve.prenom} {eleve.nom}
                </td>
                <td className="px-4 py-2.5 text-sm text-ink">
                  {synthese?.moyenne != null ? `${synthese.moyenne.toFixed(1)} / 20` : "—"}
                </td>
                <td className="px-4 py-2.5">
                  <TendanceIcon tendance={synthese?.tendance ?? null} />
                </td>
                <td className="px-4 py-2.5">
                  {synthese?.alerte && (
                    <Badge tone="danger">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Point d&apos;alerte
                      </span>
                    </Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NewBilanForm({ classeId }: { classeId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dateISO, setDateISO] = useState(() => new Date().toISOString().slice(0, 10));
  const [pointsPositifs, setPointsPositifs] = useState("");
  const [pointsVigilance, setPointsVigilance] = useState("");
  const [decisions, setDecisions] = useState("");

  const reset = () => {
    setPointsPositifs("");
    setPointsVigilance("");
    setDecisions("");
    setIsOpen(false);
  };

  const handleSubmit = () => {
    createBilanConseilClasse(classeId, dateISO, pointsPositifs, pointsVigilance, decisions);
    reset();
  };

  if (!isOpen) {
    return (
      <Button variant="secondary" onClick={() => setIsOpen(true)} className="w-fit">
        <Plus className="h-4 w-4" />
        Nouveau bilan de conseil de classe
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-card p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-ink-soft">Date du conseil</label>
        <input
          type="date"
          value={dateISO}
          onChange={(event) => setDateISO(event.target.value)}
          className="w-fit rounded-md border border-line bg-white p-2 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-ink-soft">Points positifs</label>
        <textarea
          value={pointsPositifs}
          onChange={(event) => setPointsPositifs(event.target.value)}
          rows={2}
          className="resize-y rounded-md border border-line bg-white p-2 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-ink-soft">Points de vigilance</label>
        <textarea
          value={pointsVigilance}
          onChange={(event) => setPointsVigilance(event.target.value)}
          rows={2}
          className="resize-y rounded-md border border-line bg-white p-2 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-ink-soft">Décisions</label>
        <textarea
          value={decisions}
          onChange={(event) => setDecisions(event.target.value)}
          rows={2}
          className="resize-y rounded-md border border-line bg-white p-2 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSubmit}>Enregistrer le bilan</Button>
        <Button variant="ghost" onClick={reset}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

function BilansHistory({ classeId }: { classeId: string }) {
  const bilans = useBilansConseilClasse(classeId);
  if (bilans.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {bilans.map((bilan) => (
        <div key={bilan.id} className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">
              Conseil de classe — {bilan.dateISO}
            </h3>
            <button
              type="button"
              onClick={() => deleteBilanConseilClasse(bilan.id)}
              className="text-xs text-ink-soft hover:text-rose-600"
            >
              Supprimer
            </button>
          </div>
          {bilan.pointsPositifs && (
            <p className="text-sm text-ink-soft">
              <span className="font-medium text-emerald-700">Points positifs : </span>
              {bilan.pointsPositifs}
            </p>
          )}
          {bilan.pointsVigilance && (
            <p className="text-sm text-ink-soft">
              <span className="font-medium text-amber-700">Points de vigilance : </span>
              {bilan.pointsVigilance}
            </p>
          )}
          {bilan.decisions && (
            <p className="text-sm text-ink-soft">
              <span className="font-medium text-terracotta-deep">Décisions : </span>
              {bilan.decisions}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function ConseilClasse({ classeId }: { classeId: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Synthèse par élève
        </h2>
        <SyntheseTable classeId={classeId} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Bilan du conseil de classe
        </h2>
        <NewBilanForm classeId={classeId} />
        <BilansHistory classeId={classeId} />
      </div>
    </div>
  );
}
