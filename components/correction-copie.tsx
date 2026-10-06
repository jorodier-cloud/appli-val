"use client";

import { useRef, useState, useTransition } from "react";
import { AlertCircle, Camera, ChevronDown, ChevronUp, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { upsertCorrection } from "@/lib/store";
import { clamp } from "@/lib/utils";
import { gradeStudentCopy } from "@/app/actions/grade-copy";
import { NotesHistogram } from "@/components/notes-histogram";
import type { EvaluationSuivi, QuestionScore } from "@/types/evaluation";

const MAX_SCORE = 20;
const MAX_DIMENSION = 1600;

interface Draft {
  studentName: string;
  totalScore: number;
  isReadable: boolean;
  breakdown: QuestionScore[];
  appreciation: string;
}

/**
 * Convertit la photo en JPEG via un canvas plutôt qu'un simple FileReader :
 * certains navigateurs mobiles (capture caméra Android notamment) renvoient un
 * type MIME vide ou incorrect, ce qui produit une data URL que l'API Mistral
 * rejette. Le passage par canvas force un JPEG valide et réduit au passage la
 * taille d'une photo de plusieurs Mo prise au format natif du téléphone.
 */
function fileToNormalizedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Impossible de préparer cette image."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Impossible de lire cette image."));
    };
    img.src = objectUrl;
  });
}

/** Somme des points par question, bornée à la note maximale de l'évaluation. */
function sumBreakdown(breakdown: QuestionScore[]): number {
  return clamp(
    breakdown.reduce((total, b) => total + b.pointsAwarded, 0),
    0,
    MAX_SCORE
  );
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadCsv(evaluation: EvaluationSuivi) {
  const rows = [
    ["Nom", "Note", "Appréciation"],
    ...evaluation.eleves.map((e) => [e.nom, e.note !== null ? String(e.note).replace(".", ",") : "", e.appreciation ?? ""]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${evaluation.titre || "notes"}.csv`;
  a.click();
  // Révocation différée : certains navigateurs (Firefox, Safari) annulent le
  // téléchargement si l'URL est révoquée dans le même tick que le clic.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function CorrectionCopie({
  evaluation,
  niveauNom,
}: {
  evaluation: EvaluationSuivi;
  niveauNom: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [expandedNom, setExpandedNom] = useState<string | null>(null);

  const notes = evaluation.eleves.map((s) => s.note).filter((n): n is number => n !== null);
  const moyenne = notes.length ? (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1) : "—";
  const min = notes.length ? Math.min(...notes).toFixed(1) : "—";
  const max = notes.length ? Math.max(...notes).toFixed(1) : "—";

  const handleFile = async (file: File) => {
    setError(null);
    setDraft(null);
    let dataUrl: string;
    try {
      dataUrl = await fileToNormalizedDataUrl(file);
    } catch {
      setError("Impossible de lire cette image.");
      return;
    }
    setPhotoDataUrl(dataUrl);

    startTransition(async () => {
      const result = await gradeStudentCopy({
        niveauNom,
        titre: evaluation.titre,
        bareme: evaluation.sujet,
        maxScore: MAX_SCORE,
        imageDataUrl: dataUrl,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // L'IA ne garantit pas totalScore = somme du détail : on recalcule.
      setDraft({
        studentName: result.data.studentName,
        totalScore: result.data.breakdown.length
          ? sumBreakdown(result.data.breakdown)
          : clamp(result.data.totalScore, 0, MAX_SCORE),
        isReadable: result.data.isReadable,
        breakdown: result.data.breakdown,
        appreciation: result.data.generalFeedback,
      });
    });
  };

  const resetForm = () => {
    setPhotoDataUrl(null);
    setDraft(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleValidate = () => {
    if (!draft || !draft.studentName.trim()) return;
    upsertCorrection(evaluation.id, draft.studentName, {
      note: draft.totalScore,
      breakdown: draft.breakdown,
      appreciation: draft.appreciation,
    });
    resetForm();
    setShowForm(false);
  };

  const updateBreakdownItem = (index: number, patch: Partial<QuestionScore>) => {
    if (!draft) return;
    const breakdown = draft.breakdown.map((b, i) => (i === index ? { ...b, ...patch } : b));
    setDraft({ ...draft, breakdown, totalScore: sumBreakdown(breakdown) });
  };

  return (
    <div className="mb-3 flex flex-col gap-3">
      <dl className="grid grid-cols-4 gap-2">
        {[
          { label: "moyenne /20", value: moyenne, accent: true },
          { label: "note min", value: min },
          { label: "note max", value: max },
          { label: "copies", value: String(evaluation.eleves.length) },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse">
            <dt className="whitespace-nowrap text-[11.5px] leading-tight text-ink-soft">{stat.label}</dt>
            <dd
              className={`font-display text-[19px] font-semibold leading-tight ${
                stat.accent ? "text-terracotta-deep" : "text-ink"
              }`}
            >
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <NotesHistogram notes={notes} maxScore={MAX_SCORE} />

      {evaluation.eleves.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-line">
          {evaluation.eleves.map((eleve, index) => {
            const expanded = expandedNom === eleve.nom;
            return (
              <div key={`${index}-${eleve.nom}`} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  onClick={() => setExpandedNom(expanded ? null : eleve.nom)}
                  className="flex w-full items-center justify-between gap-2 bg-white p-2.5 text-left text-[13.5px] hover:bg-card"
                >
                  <span className="font-medium text-ink">{eleve.nom}</span>
                  <span className="flex items-center gap-2 text-ink-soft">
                    <span className="truncate">{eleve.appreciation ?? ""}</span>
                    <b className="shrink-0 text-terracotta-deep">
                      {eleve.note !== null ? `${eleve.note}/20` : "—"}
                    </b>
                    {expanded ? (
                      <ChevronUp className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    )}
                  </span>
                </button>
                {expanded && (
                  <div className="space-y-2 bg-card/60 p-3 text-[13px]">
                    {eleve.appreciation && <p className="italic text-ink-soft">{eleve.appreciation}</p>}
                    {eleve.breakdown && eleve.breakdown.length > 0 ? (
                      <ul className="space-y-1.5">
                        {eleve.breakdown.map((b, i) => (
                          <li key={i} className="rounded-md bg-white p-2 text-ink">
                            <span className="font-medium">
                              {b.question} — {b.pointsAwarded}/{b.pointsPossible}
                            </span>
                            <p className="text-ink-soft">{b.feedback}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-ink-soft">Note saisie manuellement, pas de détail par question.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
          <Camera className="h-3.5 w-3.5" />
          Corriger une copie
        </Button>
        {evaluation.eleves.length > 0 && (
          <Button variant="ghost" onClick={() => downloadCsv(evaluation)}>
            <Download className="h-3.5 w-3.5" />
            Exporter CSV
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-line bg-card p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />

          {!photoDataUrl && (
            <Button onClick={() => fileInputRef.current?.click()}>
              <Camera className="h-3.5 w-3.5" />
              Prendre ou déposer une photo de copie
            </Button>
          )}

          {photoDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoDataUrl}
              alt="Copie déposée"
              className="mb-3 max-h-56 rounded-lg border border-line object-contain"
            />
          )}

          {isPending && (
            <p className="flex items-center gap-1.5 text-sm text-ink-soft">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analyse de la copie en cours…
            </p>
          )}

          {error && (
            <div className="flex flex-col items-start gap-2">
              <p className="flex items-center gap-1.5 text-xs text-terracotta-deep">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
              {photoDataUrl && !draft && (
                <Button variant="ghost" onClick={resetForm}>
                  Reprendre une photo
                </Button>
              )}
            </div>
          )}

          {draft && (
            <div className="mt-2 flex flex-col gap-3">
              {!draft.isReadable && (
                <p className="flex items-center gap-1.5 text-xs text-terracotta-deep">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Copie jugée illisible par l&apos;IA : vérifiez la photo et corrigez la note et
                  l&apos;appréciation manuellement ci-dessous.
                </p>
              )}

              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[180px] flex-1">
                  <label className="mb-1 block text-[12.5px] font-medium text-ink-soft">
                    Élève
                  </label>
                  <input
                    type="text"
                    value={draft.studentName}
                    onChange={(e) => setDraft({ ...draft, studentName: e.target.value })}
                    className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
                  />
                </div>
                <div className="w-[100px]">
                  <label className="mb-1 block text-[12.5px] font-medium text-ink-soft">
                    Note /20
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={MAX_SCORE}
                    value={draft.totalScore}
                    onChange={(e) =>
                      setDraft({ ...draft, totalScore: clamp(parseFloat(e.target.value) || 0, 0, MAX_SCORE) })
                    }
                    className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
                  />
                </div>
              </div>

              {draft.breakdown.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[12.5px] font-medium text-ink-soft">
                    Détail par question
                  </span>
                  {draft.breakdown.map((b, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white p-2">
                      <span className="min-w-[90px] text-[13px] font-medium text-ink">{b.question}</span>
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        value={b.pointsAwarded}
                        onChange={(e) =>
                          updateBreakdownItem(i, {
                            pointsAwarded: clamp(parseFloat(e.target.value) || 0, 0, b.pointsPossible),
                          })
                        }
                        className="w-16 rounded-md border border-line p-1.5 text-sm"
                      />
                      <span className="text-[13px] text-ink-soft">/ {b.pointsPossible}</span>
                      <input
                        type="text"
                        value={b.feedback}
                        onChange={(e) => updateBreakdownItem(i, { feedback: e.target.value })}
                        className="min-w-[160px] flex-1 rounded-md border border-line p-1.5 text-[13px]"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="mb-1 block text-[12.5px] font-medium text-ink-soft">
                  Appréciation
                </label>
                <textarea
                  rows={2}
                  value={draft.appreciation}
                  onChange={(e) => setDraft({ ...draft, appreciation: e.target.value })}
                  className="w-full resize-y rounded-lg border border-line bg-white p-2.5 text-[13.5px] leading-relaxed text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleValidate} disabled={!draft.studentName.trim()}>
                  Valider et enregistrer
                </Button>
                <Button variant="ghost" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
