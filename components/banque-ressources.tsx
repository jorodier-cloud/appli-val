"use client";

import { useMemo, useState } from "react";
import { useAllRessources } from "@/lib/store";
import { ResourceModal, LABEL_RESSOURCE } from "@/components/resource-modal";

export function BanqueRessources() {
  const ressources = useAllRessources();
  const [filtreNiveau, setFiltreNiveau] = useState("");
  const [openRessourceId, setOpenRessourceId] = useState<string | null>(null);

  const niveauxDisponibles = useMemo(
    () => Array.from(new Set(ressources.map((r) => r.niveauNom))).sort(),
    [ressources]
  );

  const filtered = useMemo(
    () =>
      [...ressources]
        .filter((r) => !filtreNiveau || r.niveauNom === filtreNiveau)
        .reverse(),
    [ressources, filtreNiveau]
  );

  return (
    <div className="flex flex-col gap-6">
      {niveauxDisponibles.length > 0 && (
        <div className="max-w-xs">
          <label className="mb-1 block text-[11.5px] uppercase tracking-wide text-ink-soft">
            Filtrer par niveau
          </label>
          <select
            value={filtreNiveau}
            onChange={(e) => setFiltreNiveau(e.target.value)}
            className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
          >
            <option value="">Tous</option>
            {niveauxDisponibles.map((nom) => (
              <option key={nom} value={nom}>
                {nom}
              </option>
            ))}
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-soft">Aucun support enregistré pour ce filtre.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setOpenRessourceId(r.id)}
              className="rounded-2xl border border-line bg-card p-4 text-left shadow-[var(--shadow-riwaq)] transition-colors hover:border-terracotta"
            >
              <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wide text-terracotta-deep">
                {r.niveauNom} · {LABEL_RESSOURCE[r.type]}
              </span>
              <h3 className="mb-1.5 text-[15px] font-semibold leading-snug text-ink">
                {r.chapitreTitre}
              </h3>
              <p className="text-xs text-ink-soft">
                {new Date(r.createdAtISO).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </button>
          ))}
        </div>
      )}

      <ResourceModal ressourceId={openRessourceId} onClose={() => setOpenRessourceId(null)} />
    </div>
  );
}
