"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useNiveaux, useAllProgressionItems, useAllRessources, useAllEvaluations } from "@/lib/store";
import { summarizeNiveau } from "@/lib/dashboard";
import { BackupControls } from "@/components/backup-controls";
import { ResourceModal, LABEL_RESSOURCE } from "@/components/resource-modal";

const ARCH_COLORS = ["var(--color-sauge)", "var(--color-terracotta)", "var(--color-ochre)"];

export function Dashboard() {
  const niveaux = useNiveaux();
  const progressionItems = useAllProgressionItems();
  const ressources = useAllRessources();
  const evaluations = useAllEvaluations();
  const [openRessourceId, setOpenRessourceId] = useState<string | null>(null);

  const summaries = useMemo(
    () => niveaux.map((n) => summarizeNiveau(n, progressionItems)),
    [niveaux, progressionItems]
  );

  const aRestituer = useMemo(
    () =>
      evaluations.filter((e) => e.corrigeRessourceId && !e.restituee).map((e) => ({
        ...e,
        niveauNom: niveaux.find((n) => n.id === e.niveauId)?.nom ?? "",
      })),
    [evaluations, niveaux]
  );

  const derniersSupports = useMemo(() => ressources.slice(-3).reverse(), [ressources]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-terracotta/40 bg-card p-5">
        <div>
          <strong className="mb-1 block text-sm text-ink">Sauvegarde manuelle</strong>
          <span className="text-[12.5px] text-ink-soft">
            Vos données sont déjà enregistrées automatiquement dans ce navigateur. Exportez une
            copie de temps en temps pour vous prémunir d&apos;un vidage du cache.
          </span>
        </div>
        <BackupControls variant="inline" />
      </div>

      {aRestituer.length > 0 && (
        <div className="rounded-2xl border border-terracotta bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-[17px] text-ink">
            <span className="inline-block h-0.5 w-5 bg-terracotta" />À restituer
          </h2>
          <div className="flex flex-col gap-2">
            {aRestituer.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-4 text-sm">
                <span>
                  {e.titre} — {e.niveauNom}
                </span>
                <Link
                  href="/evaluations"
                  className="rounded-lg border border-sauge px-3 py-1.5 text-xs font-semibold text-sauge hover:bg-sauge hover:text-white"
                >
                  Ouvrir
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {niveaux.length === 0 ? (
        <p className="text-sm text-ink-soft">
          Aucun niveau créé pour l&apos;instant — direction l&apos;onglet « Mes progressions ».
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {summaries.map((summary, index) => (
            <div
              key={summary.niveau.id}
              className="arch-top flex flex-col rounded-2xl border border-line bg-card p-5 shadow-[var(--shadow-riwaq)]"
              style={{ ["--arch-color" as string]: ARCH_COLORS[index % ARCH_COLORS.length] }}
            >
              <h3 className="text-lg font-semibold text-ink">{summary.niveau.nom}</h3>
              <div className="mb-3.5 text-[12.5px] text-ink-soft">
                {summary.prochainChapitre
                  ? `À venir — ${summary.prochainChapitre}`
                  : summary.chapitresTotal > 0
                    ? "Progression terminée"
                    : "Aucun chapitre pour l'instant"}
              </div>
              <div className="mb-2 h-[7px] overflow-hidden rounded-full bg-line/60">
                <div
                  className="h-full rounded-full bg-[var(--arch-color)]"
                  style={{ width: `${summary.progressionPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-ink-soft">
                <span>
                  {summary.chapitresTraites}/{summary.chapitresTotal} chapitres
                </span>
                <span>{summary.progressionPct}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-[17px] text-ink">
          <span className="inline-block h-0.5 w-5 bg-terracotta" />
          Derniers supports créés
        </h2>
        {derniersSupports.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Aucun support pour l&apos;instant — le générateur vous attend.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {derniersSupports.map((r) => (
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
      </div>

      <ResourceModal ressourceId={openRessourceId} onClose={() => setOpenRessourceId(null)} />
    </div>
  );
}
