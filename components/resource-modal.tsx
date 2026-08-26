"use client";

import { Copy, Download, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRessource, removeRessource } from "@/lib/store";
import { downloadAsWord, markdownToHtml } from "@/lib/markdown";
import type { TypeRessource } from "@/types/contenu";

export const LABEL_RESSOURCE: Record<TypeRessource, string> = {
  synthese: "Synthèse de cours",
  fiche: "Fiche d'exercices",
  evaluation: "Évaluation",
  rapidos: "Série de Rapidos",
  corrige: "Corrigé détaillé",
};

interface ResourceModalProps {
  ressourceId: string | null;
  onClose: () => void;
}

export function ResourceModal({ ressourceId, onClose }: ResourceModalProps) {
  const ressource = useRessource(ressourceId);

  if (!ressource) return null;

  const handleDelete = () => {
    if (!confirm("Supprimer ce support ?")) return;
    removeRessource(ressource.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] overflow-auto bg-ink/55 px-4 py-8"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mx-auto max-w-3xl rounded-2xl bg-card p-7 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.5)]">
        <h2 className="font-display text-xl font-semibold text-ink">{ressource.chapitreTitre}</h2>
        <p className="mt-1 text-xs text-ink-soft">
          {ressource.niveauNom} · {LABEL_RESSOURCE[ressource.type]} ·{" "}
          {new Date(ressource.createdAtISO).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <div
          className="doc-content my-4 max-h-[56vh] overflow-auto rounded-xl border border-line bg-white p-6 text-[14.5px] leading-relaxed text-ink"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(ressource.contenu) }}
        />

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" className="border-terracotta/40 text-terracotta-deep hover:bg-terracotta/10" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" />
            Supprimer
          </Button>
          <Button variant="ghost" onClick={() => navigator.clipboard.writeText(ressource.contenu)}>
            <Copy className="h-3.5 w-3.5" />
            Copier le texte
          </Button>
          <Button variant="ghost" onClick={() => downloadAsWord(`${ressource.niveauNom}-${ressource.chapitreTitre}`, ressource.contenu)}>
            <Download className="h-3.5 w-3.5" />
            Télécharger en Word
          </Button>
          <Button onClick={onClose}>
            <X className="h-3.5 w-3.5" />
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
