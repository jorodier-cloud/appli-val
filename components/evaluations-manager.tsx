"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useNiveaux,
  useAllEvaluations,
  createEvaluation,
  updateEvaluation,
  updateEvaluationNotionsRatees,
  setEvaluationCorrige,
  marquerEvaluationRestituee,
  removeEvaluation,
  addRessource,
} from "@/lib/store";
import { generateCorrige } from "@/app/actions/generate-corrige";
import { ResourceModal } from "@/components/resource-modal";
import type { NoteEleve } from "@/types/evaluation";

function parseStudents(text: string): NoteEleve[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => {
      const [nomPart, notePart] = line.split(";");
      const nom = (nomPart ?? "").trim();
      const note = notePart !== undefined ? parseFloat(notePart.replace(",", ".")) : NaN;
      return { nom, note: Number.isNaN(note) ? null : note };
    })
    .filter((s) => s.nom.length > 0);
}

function studentsToText(eleves: NoteEleve[]): string {
  return eleves.map((s) => `${s.nom};${s.note !== null ? s.note : ""}`).join("\n");
}

function EvaluationForm({
  editingId,
  onDone,
}: {
  editingId: string | null;
  onDone: () => void;
}) {
  const niveaux = useNiveaux();
  const evaluations = useAllEvaluations();
  const editing = editingId ? evaluations.find((e) => e.id === editingId) ?? null : null;

  const [niveauId, setNiveauId] = useState(editing?.niveauId ?? "");
  const [titre, setTitre] = useState(editing?.titre ?? "");
  const [dateEval, setDateEval] = useState(editing?.dateEvalISO ?? "");
  const [sujet, setSujet] = useState(editing?.sujet ?? "");
  const [notesText, setNotesText] = useState(editing ? studentsToText(editing.eleves) : "");

  // Le store hydrate depuis localStorage après le premier rendu client : pour
  // une nouvelle évaluation, on ne connaît le premier niveau qu'une fois
  // `niveaux` chargé.
  useEffect(() => {
    if (!editingId && !niveauId && niveaux.length > 0) setNiveauId(niveaux[0]!.id);
  }, [editingId, niveaux, niveauId]);

  const handleSave = () => {
    if (!niveauId || !titre.trim()) return;
    const eleves = parseStudents(notesText);
    if (editingId) {
      updateEvaluation(editingId, { niveauId, titre, dateEvalISO: dateEval, sujet, eleves });
    } else {
      createEvaluation({ niveauId, titre, dateEvalISO: dateEval, sujet, eleves });
    }
    onDone();
    setTitre("");
    setDateEval("");
    setSujet("");
    setNotesText("");
  };

  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-[var(--shadow-riwaq)]">
      <h3 className="mb-3.5 text-base font-semibold text-ink">
        {editingId ? "Modifier l'évaluation" : "Nouvelle évaluation"}
      </h3>
      <div className="mb-3 flex flex-wrap items-start gap-4">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-[11.5px] uppercase tracking-wide text-ink-soft">Niveau</label>
          <select
            value={niveauId}
            onChange={(e) => setNiveauId(e.target.value)}
            className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
          >
            <option value="">— choisir —</option>
            {niveaux.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nom}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px] flex-[2]">
          <label className="mb-1 block text-[11.5px] uppercase tracking-wide text-ink-soft">
            Titre / chapitre
          </label>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Ex. Évaluation — Statistiques"
            className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
          />
        </div>
        <div className="min-w-[150px]">
          <label className="mb-1 block text-[11.5px] uppercase tracking-wide text-ink-soft">
            Date de l&apos;évaluation
          </label>
          <input
            type="date"
            value={dateEval}
            onChange={(e) => setDateEval(e.target.value)}
            className="w-auto rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-[11.5px] uppercase tracking-wide text-ink-soft">
          Sujet ou barème (facultatif — collez-le si vous en avez un, sinon le corrigé sera généré à
          partir du titre)
        </label>
        <textarea
          rows={4}
          value={sujet}
          onChange={(e) => setSujet(e.target.value)}
          placeholder="Collez ici le sujet ou le barème par compétences…"
          className="w-full resize-y rounded-lg border border-line bg-white p-2.5 text-[13.5px] leading-relaxed text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        />
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-[11.5px] uppercase tracking-wide text-ink-soft">
          Notes des élèves — une ligne par élève : Nom;Note
        </label>
        <textarea
          rows={5}
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
          placeholder={"Léa B.;17\nYanis K.;12\nInès T.;9"}
          className="w-full resize-y rounded-lg border border-line bg-white p-2.5 text-[13.5px] leading-relaxed text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={!niveauId || !titre.trim()}>
          {editingId ? "Enregistrer les modifications" : "Enregistrer l'évaluation"}
        </Button>
        {editingId && (
          <Button variant="ghost" onClick={onDone}>
            Annuler la modification
          </Button>
        )}
      </div>
    </div>
  );
}

function fmtDate(iso: string): string {
  if (!iso) return "date non précisée";
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function EvaluationCard({
  evaluationId,
  onEdit,
  onOpenRessource,
}: {
  evaluationId: string;
  onEdit: (id: string) => void;
  onOpenRessource: (id: string) => void;
}) {
  const niveaux = useNiveaux();
  const evaluations = useAllEvaluations();
  const evaluation = evaluations.find((e) => e.id === evaluationId);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!evaluation) return null;

  const niveauNom = niveaux.find((n) => n.id === evaluation.niveauId)?.nom ?? "?";
  const notes = evaluation.eleves.map((s) => s.note).filter((n): n is number => n !== null);
  const moyenne = notes.length ? (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1) : "—";

  const handleGenerateCorrige = () => {
    setError(null);
    startTransition(async () => {
      const result = await generateCorrige({
        niveauNom,
        titre: evaluation.titre,
        sujet: evaluation.sujet,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const ressource = addRessource({
        type: "corrige",
        niveauNom,
        chapitreTitre: evaluation.titre,
        notes: "",
        contenu: result.content,
      });
      setEvaluationCorrige(evaluation.id, ressource.id);
      onOpenRessource(ressource.id);
    });
  };

  return (
    <div className="arch-top flex flex-col rounded-2xl border border-line bg-card p-5 shadow-[var(--shadow-riwaq)]">
      <h3 className="text-[17px] font-semibold text-ink">{evaluation.titre}</h3>
      <div className="mb-3 text-[12.5px] text-ink-soft">
        {niveauNom} · {fmtDate(evaluation.dateEvalISO)}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            evaluation.corrigeRessourceId ? "bg-sauge/15 text-sauge" : "bg-line/60 text-ink-soft"
          }`}
        >
          {evaluation.corrigeRessourceId ? "Corrigé prêt" : "Corrigé à générer"}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            evaluation.restituee ? "bg-sauge/15 text-sauge" : "bg-ochre/20 text-[#8A6414]"
          }`}
        >
          {evaluation.restituee
            ? `Restituée le ${evaluation.dateRestitutionISO ? fmtDate(evaluation.dateRestitutionISO.slice(0, 10)) : ""}`
            : "Non restituée"}
        </span>
      </div>

      <div className="mb-3 flex gap-5">
        <div>
          <b className="block font-display text-[19px] text-terracotta-deep">{moyenne}</b>
          <span className="text-[11px] text-ink-soft">moyenne /20</span>
        </div>
        <div>
          <b className="block font-display text-[19px] text-terracotta-deep">{evaluation.eleves.length}</b>
          <span className="text-[11px] text-ink-soft">élèves</span>
        </div>
      </div>

      <textarea
        rows={2}
        value={evaluation.notionsRatees}
        onChange={(e) => updateEvaluationNotionsRatees(evaluation.id, e.target.value)}
        placeholder="Cliquez pour noter les notions ratées à réactiver…"
        className="mb-3 w-full resize-none rounded-lg border border-line bg-white p-2 text-[13px] italic placeholder:text-[#A8987F] focus:border-terracotta-deep focus:outline-none focus:not-italic"
      />

      {error && (
        <p className="mb-2 flex items-center gap-1.5 text-xs text-terracotta-deep">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {evaluation.corrigeRessourceId ? (
          <Button variant="ghost" onClick={() => onOpenRessource(evaluation.corrigeRessourceId!)}>
            Voir le corrigé
          </Button>
        ) : (
          <Button onClick={handleGenerateCorrige} disabled={isPending}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Générer le corrigé
          </Button>
        )}
        {!evaluation.restituee && (
          <Button variant="ghost" onClick={() => marquerEvaluationRestituee(evaluation.id)}>
            Marquer restituée (J+1)
          </Button>
        )}
        <Button variant="ghost" onClick={() => onEdit(evaluation.id)}>
          Modifier
        </Button>
        <Button
          variant="secondary"
          className="border-terracotta/40 text-terracotta-deep hover:bg-terracotta/10"
          onClick={() => {
            if (confirm("Supprimer cette évaluation ?")) removeEvaluation(evaluation.id);
          }}
        >
          Supprimer
        </Button>
      </div>
    </div>
  );
}

export function EvaluationsManager() {
  const evaluations = useAllEvaluations();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openRessourceId, setOpenRessourceId] = useState<string | null>(null);

  const sorted = [...evaluations].sort((a, b) => (b.dateEvalISO || "").localeCompare(a.dateEvalISO || ""));

  return (
    <div className="flex flex-col gap-6">
      <EvaluationForm key={editingId ?? "new"} editingId={editingId} onDone={() => setEditingId(null)} />

      <div>
        <h2 className="mb-3.5 flex items-center gap-2 text-[17px] text-ink">
          <span className="inline-block h-0.5 w-5 bg-terracotta" />
          Évaluations enregistrées
        </h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Aucune évaluation enregistrée. Le formulaire ci-dessus vous attend.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((e) => (
              <EvaluationCard
                key={e.id}
                evaluationId={e.id}
                onEdit={setEditingId}
                onOpenRessource={setOpenRessourceId}
              />
            ))}
          </div>
        )}
      </div>

      <ResourceModal ressourceId={openRessourceId} onClose={() => setOpenRessourceId(null)} />
    </div>
  );
}
