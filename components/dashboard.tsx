"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  useClasses,
  useNiveaux,
  useAllProgressionItems,
  useAllEleves,
  useAllEvaluations,
  useAllNotes,
  useAllSupportsCours,
  useAllFichesExercices,
  useAllEvaluationsGenerees,
  useAllEvaluationCompetences,
} from "@/lib/store";
import { summarizeClasse } from "@/lib/dashboard";
import { tauxAcquisition } from "@/lib/competences";

const ARCH_COLORS = ["var(--color-sauge)", "var(--color-terracotta)", "var(--color-ochre)"];

export function Dashboard() {
  const classes = useClasses();
  const niveaux = useNiveaux();
  const progressionItems = useAllProgressionItems();
  const eleves = useAllEleves();
  const evaluations = useAllEvaluations();
  const notes = useAllNotes();
  const supportsCours = useAllSupportsCours();
  const fichesExercices = useAllFichesExercices();
  const evaluationsGenerees = useAllEvaluationsGenerees();
  const evaluationCompetences = useAllEvaluationCompetences();

  // Stable pour la durée du rendu, calculé une fois au montage plutôt qu'à
  // chaque re-render (évite un recalcul de todayISO en boucle avec useMemo []).
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const summaries = useMemo(
    () =>
      classes.map((c) =>
        summarizeClasse(c, niveaux, progressionItems, eleves, evaluations, notes, todayISO)
      ),
    [classes, niveaux, progressionItems, eleves, evaluations, notes, todayISO]
  );

  const fichesGenereesCetteSemaine = useMemo(() => {
    const seuil = new Date();
    seuil.setDate(seuil.getDate() - 7);
    const seuilISO = seuil.toISOString();
    return [...supportsCours, ...fichesExercices, ...evaluationsGenerees].filter(
      (c) => c.createdAtISO >= seuilISO
    ).length;
  }, [supportsCours, fichesExercices, evaluationsGenerees]);

  const tauxMoyen = tauxAcquisition(evaluationCompetences);

  const derniereNote = useMemo(
    () => [...notes].sort((a, b) => b.updatedAtISO.localeCompare(a.updatedAtISO))[0] ?? null,
    [notes]
  );
  const derniereEvaluation = derniereNote
    ? evaluations.find((e) => e.id === derniereNote.evaluationId) ?? null
    : null;
  const derniereClasse = derniereEvaluation
    ? classes.find((c) => c.id === derniereEvaluation.classeId) ?? null
    : null;

  return (
    <div className="flex flex-col gap-8">
      {classes.length === 0 ? (
        <p className="text-sm text-ink-soft">
          Aucune classe créée pour l&apos;instant — direction l&apos;onglet
          « Mes classes ».
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {summaries.map((summary, index) => (
            <div
              key={summary.classe.id}
              className="arch-top flex flex-col rounded-2xl border border-line bg-card p-5 shadow-[var(--shadow-riwaq)]"
              style={{ ["--arch-color" as string]: ARCH_COLORS[index % ARCH_COLORS.length] }}
            >
              <h3 className="text-lg font-semibold text-ink">{summary.classe.nom}</h3>
              <div className="mb-3.5 text-[13px] text-ink-soft">
                {summary.chapitreEnCoursTitre
                  ? `Chapitre en cours — ${summary.chapitreEnCoursTitre}`
                  : summary.niveauNom
                    ? "Aucune progression définie pour ce niveau"
                    : "Aucun niveau lié à cette classe"}
              </div>
              {summary.progressionPct !== null && (
                <div className="mb-2 h-[7px] overflow-hidden rounded-full bg-line/60">
                  <div
                    className="h-full rounded-full bg-terracotta"
                    style={{ width: `${summary.progressionPct}%` }}
                  />
                </div>
              )}
              <div className="flex justify-between text-xs text-ink-soft">
                {summary.progressionPct !== null && (
                  <span>{summary.progressionPct}% de la séquence</span>
                )}
                <span>
                  {summary.effectif} élève{summary.effectif !== 1 ? "s" : ""}
                </span>
              </div>
              {summary.elevesSansNote > 0 && (
                <span className="mt-3.5 inline-block w-fit rounded-lg bg-terracotta/15 px-2.5 py-1.5 text-xs text-terracotta-deep">
                  {summary.elevesSansNote} élève{summary.elevesSansNote !== 1 ? "s" : ""} sans
                  note
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <div className="min-w-[160px] flex-1 rounded-2xl border border-line bg-card p-4">
          <div className="font-display text-[26px] font-semibold text-terracotta-deep">
            {classes.length}
          </div>
          <div className="mt-0.5 text-[12.5px] text-ink-soft">classes actives</div>
        </div>
        <div className="min-w-[160px] flex-1 rounded-2xl border border-line bg-card p-4">
          <div className="font-display text-[26px] font-semibold text-terracotta-deep">
            {fichesGenereesCetteSemaine}
          </div>
          <div className="mt-0.5 text-[12.5px] text-ink-soft">
            fiches générées cette semaine
          </div>
        </div>
        <div className="min-w-[160px] flex-1 rounded-2xl border border-line bg-card p-4">
          <div className="font-display text-[26px] font-semibold text-terracotta-deep">
            {tauxMoyen !== null ? `${Math.round(tauxMoyen)}%` : "—"}
          </div>
          <div className="mt-0.5 text-[12.5px] text-ink-soft">
            compétences acquises, moyenne
          </div>
        </div>
      </div>

      {derniereNote && derniereEvaluation && derniereClasse && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-[17px] text-ink">
            <span className="inline-block h-0.5 w-5 bg-terracotta" />
            Reprendre où vous en étiez
          </h2>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-card px-5 py-4">
            <div>
              <div className="text-sm font-semibold text-ink">
                {derniereEvaluation.titre} — {derniereClasse.nom}
              </div>
              <div className="mt-1 inline-block rounded-lg bg-[#E4EDE2] px-2.5 py-1 text-[11.5px] text-sauge">
                Dernière note enregistrée
              </div>
            </div>
            <Link
              href="/classes"
              className="rounded-lg border border-sauge px-4 py-2.5 text-[13.5px] font-semibold text-sauge transition-colors hover:bg-sauge hover:text-white"
            >
              Ouvrir
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
