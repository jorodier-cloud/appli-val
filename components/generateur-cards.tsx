"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNiveaux, useProgression, useAllEvaluations, addRessource } from "@/lib/store";
import { generateSupport, type TypeSupport } from "@/app/actions/generate-content";
import {
  generateRapidosSerie,
  type SourceRapidos,
} from "@/app/actions/generate-rapidos";
import { ResourceModal } from "@/components/resource-modal";

const CARD_META: Record<TypeSupport, { title: string; description: string; archColor: string; cta: string }> = {
  synthese: {
    title: "Synthèse de cours",
    description: "Résumé structuré, définitions, propriétés, exemples types.",
    archColor: "var(--color-sauge)",
    cta: "Générer la synthèse",
  },
  fiche: {
    title: "Fiche d'exercices progressive",
    description: "Difficulté croissante, corrigé détaillé en fin de fiche.",
    archColor: "var(--color-terracotta)",
    cta: "Générer la fiche",
  },
  evaluation: {
    title: "Évaluation",
    description: "Sujet noté sur 20 avec barème par compétences et corrigé.",
    archColor: "var(--color-ochre)",
    cta: "Générer l'évaluation",
  },
};

function NiveauChapitreFields({
  niveauId,
  onNiveauChange,
  chapitreTitre,
  onChapitreChange,
}: {
  niveauId: string | null;
  onNiveauChange: (id: string) => void;
  chapitreTitre: string;
  onChapitreChange: (titre: string) => void;
}) {
  const niveaux = useNiveaux();
  const progression = useProgression(niveauId);

  // Le store hydrate depuis localStorage après le premier rendu client : on
  // ne peut pas se contenter d'un état initial calculé à partir de niveaux/
  // progression, il faut resynchroniser dès qu'ils deviennent disponibles.
  useEffect(() => {
    if (!niveauId && niveaux.length > 0) onNiveauChange(niveaux[0]!.id);
  }, [niveaux, niveauId, onNiveauChange]);

  useEffect(() => {
    if (progression.length === 0) {
      if (chapitreTitre) onChapitreChange("");
      return;
    }
    if (!progression.some((c) => c.titre === chapitreTitre)) {
      onChapitreChange(progression[0]!.titre);
    }
  }, [progression, chapitreTitre, onChapitreChange]);

  return (
    <>
      <div className="mb-2.5">
        <label className="mb-1 block text-[11.5px] uppercase tracking-wide text-ink-soft">Niveau</label>
        <select
          value={niveauId ?? ""}
          onChange={(e) => onNiveauChange(e.target.value)}
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
      <div className="mb-3.5">
        <label className="mb-1 block text-[11.5px] uppercase tracking-wide text-ink-soft">Chapitre</label>
        <select
          value={chapitreTitre}
          onChange={(e) => onChapitreChange(e.target.value)}
          disabled={progression.length === 0}
          className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep disabled:bg-card disabled:text-ink-soft"
        >
          {progression.length === 0 ? (
            <option value="">— aucun chapitre —</option>
          ) : (
            progression.map((c) => (
              <option key={c.id} value={c.titre}>
                {c.titre}
              </option>
            ))
          )}
        </select>
      </div>
    </>
  );
}

function GenerationCard({
  type,
  notes,
  etablissement,
  onGenerated,
}: {
  type: TypeSupport;
  notes: string;
  etablissement: string;
  onGenerated: (ressourceId: string) => void;
}) {
  const meta = CARD_META[type];
  const niveaux = useNiveaux();
  const [niveauId, setNiveauId] = useState<string | null>(null);
  const [chapitreTitre, setChapitreTitre] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    const niveauNom = niveaux.find((n) => n.id === niveauId)?.nom;
    if (!niveauNom || !chapitreTitre) {
      setError("Choisissez un niveau et un chapitre.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await generateSupport({ type, niveauNom, chapitreTitre, notes, etablissement });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const ressource = addRessource({
        type,
        niveauNom,
        chapitreTitre,
        notes,
        contenu: result.content,
      });
      onGenerated(ressource.id);
    });
  };

  return (
    <div
      className="arch-top flex flex-col rounded-2xl border border-line bg-card p-5 shadow-[var(--shadow-riwaq)]"
      style={{ ["--arch-color" as string]: meta.archColor }}
    >
      <h3 className="text-lg font-semibold text-ink">{meta.title}</h3>
      <p className="mb-3.5 mt-1 text-[13px] leading-relaxed text-ink-soft">{meta.description}</p>
      <NiveauChapitreFields
        niveauId={niveauId}
        onNiveauChange={setNiveauId}
        chapitreTitre={chapitreTitre}
        onChapitreChange={setChapitreTitre}
      />
      {error && (
        <p className="mb-2 flex items-center gap-1.5 text-xs text-terracotta-deep">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
      <Button className="mt-auto w-full" onClick={handleGenerate} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {isPending ? "Génération…" : meta.cta}
      </Button>
    </div>
  );
}

function RapidosCard({ notes, onGenerated }: { notes: string; onGenerated: (ressourceId: string) => void }) {
  const niveaux = useNiveaux();
  const evaluations = useAllEvaluations();
  const [niveauId, setNiveauId] = useState<string | null>(null);
  const [nb, setNb] = useState(10);
  const [source, setSource] = useState<SourceRapidos>("mix");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!niveauId && niveaux.length > 0) setNiveauId(niveaux[0]!.id);
  }, [niveaux, niveauId]);

  const progression = useProgression(niveauId);
  const traites = progression.filter((c) => c.traite);

  const handleGenerate = () => {
    const niveauNom = niveaux.find((n) => n.id === niveauId)?.nom;
    if (!niveauNom) {
      setError("Choisissez un niveau.");
      return;
    }
    setError(null);
    setProgressLabel("Génération de la série…");
    const notionsAReactiver = [
      ...new Set(
        evaluations
          .filter((e) => e.niveauId === niveauId && e.notionsRatees.trim())
          .map((e) => e.notionsRatees.trim())
      ),
    ];
    startTransition(async () => {
      const result = await generateRapidosSerie({
        niveauNom,
        chapitresTraites: traites.map((c) => c.titre),
        source,
        nb,
        notes,
        notionsAReactiver,
      });
      setProgressLabel(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const ressource = addRessource({
        type: "rapidos",
        niveauNom,
        chapitreTitre: `Série de ${nb} Rapidos`,
        notes,
        contenu: result.content,
      });
      onGenerated(ressource.id);
    });
  };

  return (
    <div
      className="arch-top flex flex-col rounded-2xl border border-line bg-card p-5 shadow-[var(--shadow-riwaq)]"
      style={{ ["--arch-color" as string]: "var(--color-sauge-light)" }}
    >
      <h3 className="text-lg font-semibold text-ink">Série de Rapidos</h3>
      <p className="mb-3.5 mt-1 text-[13px] leading-relaxed text-ink-soft">
        Rituel de début de séance : 5 questions courtes, puisées dans les chapitres déjà traités
        et les années précédentes. Test de 10 questions en fin de série.
      </p>

      <div className="mb-2.5">
        <label className="mb-1 block text-[11.5px] uppercase tracking-wide text-ink-soft">Niveau</label>
        <select
          value={niveauId ?? ""}
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

      <div className="mb-2.5">
        <label className="mb-1 block text-[11.5px] uppercase tracking-wide text-ink-soft">
          Longueur de la série
        </label>
        <select
          value={nb}
          onChange={(e) => setNb(Number(e.target.value))}
          className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        >
          <option value={10}>10 Rapidos + test</option>
          <option value={12}>12 Rapidos + test</option>
        </select>
      </div>

      <div className="mb-1.5">
        <label className="mb-1 block text-[11.5px] uppercase tracking-wide text-ink-soft">Puiser dans</label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as SourceRapidos)}
          className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        >
          <option value="mix">Chapitres traités + rappels années précédentes</option>
          <option value="annee">Chapitres traités cette année seulement</option>
          <option value="anterieur">Rappels des années précédentes seulement</option>
        </select>
      </div>

      <p className="mb-2.5 text-xs text-ink-soft">
        {traites.length
          ? `${traites.length} chapitre${traites.length > 1 ? "s" : ""} traité${traites.length > 1 ? "s" : ""} : ${traites.map((c) => c.titre).join(", ")}`
          : "Aucun chapitre coché comme traité — la série portera sur les rappels antérieurs."}
      </p>

      {error && (
        <p className="mb-2 flex items-center gap-1.5 text-xs text-terracotta-deep">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <Button className="mt-auto w-full" onClick={handleGenerate} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {isPending ? progressLabel ?? "Génération…" : "Générer la série"}
      </Button>
    </div>
  );
}

export function GenerateurCards() {
  const [notes, setNotes] = useState("");
  const [etablissement, setEtablissement] = useState("");
  const [openRessourceId, setOpenRessourceId] = useState<string | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("riwaq:etablissement") : null;
    if (saved) setEtablissement(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("riwaq:etablissement", etablissement);
  }, [etablissement]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <GenerationCard type="synthese" notes={notes} etablissement={etablissement} onGenerated={setOpenRessourceId} />
        <GenerationCard type="fiche" notes={notes} etablissement={etablissement} onGenerated={setOpenRessourceId} />
        <GenerationCard type="evaluation" notes={notes} etablissement={etablissement} onGenerated={setOpenRessourceId} />
        <RapidosCard notes={notes} onGenerated={setOpenRessourceId} />
      </div>

      <div className="max-w-xl">
        <label className="mb-1 block text-[11.5px] uppercase tracking-wide text-ink-soft">
          Établissement (en-tête des synthèses)
        </label>
        <input
          type="text"
          value={etablissement}
          onChange={(e) => setEtablissement(e.target.value)}
          placeholder="Ex. : Lycée Français Victor Hugo"
          className="mb-4 w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        />
        <label className="mb-1 block text-[11.5px] uppercase tracking-wide text-ink-soft">
          Consignes complémentaires (facultatif)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex. : classe hétérogène, prévoir 3 exercices différenciés"
          className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        />
      </div>

      <ResourceModal ressourceId={openRessourceId} onClose={() => setOpenRessourceId(null)} />
    </div>
  );
}
