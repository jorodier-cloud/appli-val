"use client";

import { useState } from "react";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFiches, createFiche, updateFiche, deleteFiche } from "@/lib/store";
import type { Fiche, TypeFiche } from "@/types/fiches";

function NewFicheForm({ type, themePlaceholder }: { type: TypeFiche; themePlaceholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [titre, setTitre] = useState("");
  const [theme, setTheme] = useState("");
  const [contenu, setContenu] = useState("");

  const reset = () => {
    setTitre("");
    setTheme("");
    setContenu("");
    setIsOpen(false);
  };

  const handleSubmit = () => {
    if (!titre.trim()) return;
    createFiche(type, titre, theme, contenu);
    reset();
  };

  if (!isOpen) {
    return (
      <Button variant="secondary" onClick={() => setIsOpen(true)} className="w-fit">
        <Plus className="h-4 w-4" />
        Nouvelle fiche
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-card p-4">
      <input
        autoFocus
        value={titre}
        onChange={(event) => setTitre(event.target.value)}
        placeholder="Titre"
        className="rounded-md border border-line bg-white p-2 text-sm text-ink placeholder:text-ink-soft focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
      />
      <input
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
        placeholder={themePlaceholder}
        className="rounded-md border border-line bg-white p-2 text-sm text-ink placeholder:text-ink-soft focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
      />
      <textarea
        value={contenu}
        onChange={(event) => setContenu(event.target.value)}
        placeholder="Contenu de la fiche…"
        rows={6}
        className="resize-y rounded-md border border-line bg-white p-2 text-sm text-ink placeholder:text-ink-soft focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
      />
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={!titre.trim()}>
          Enregistrer
        </Button>
        <Button variant="ghost" onClick={reset}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

function FicheCard({ fiche }: { fiche: Fiche }) {
  const [isEditing, setIsEditing] = useState(false);
  const [titre, setTitre] = useState(fiche.titre);
  const [theme, setTheme] = useState(fiche.theme);
  const [contenu, setContenu] = useState(fiche.contenu);

  const handleSave = () => {
    updateFiche(fiche.id, { titre, theme, contenu });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitre(fiche.titre);
    setTheme(fiche.theme);
    setContenu(fiche.contenu);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-indigo-200 bg-terracotta/10 p-4">
        <input
          value={titre}
          onChange={(event) => setTitre(event.target.value)}
          className="rounded-md border border-line bg-white p-2 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        />
        <input
          value={theme}
          onChange={(event) => setTheme(event.target.value)}
          className="rounded-md border border-line bg-white p-2 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        />
        <textarea
          value={contenu}
          onChange={(event) => setContenu(event.target.value)}
          rows={6}
          className="resize-y rounded-md border border-line bg-white p-2 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        />
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!titre.trim()}>
            Enregistrer
          </Button>
          <Button variant="ghost" onClick={handleCancel}>
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-terracotta" />
          <h3 className="text-sm font-semibold text-ink">{fiche.titre}</h3>
          {fiche.theme && <Badge tone="neutral">{fiche.theme}</Badge>}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-md p-1.5 text-ink-soft hover:bg-terracotta/10 hover:text-terracotta"
            aria-label={`Modifier ${fiche.titre}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => deleteFiche(fiche.id)}
            className="rounded-md p-1.5 text-ink-soft hover:bg-rose-50 hover:text-rose-600"
            aria-label={`Supprimer ${fiche.titre}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {fiche.contenu && (
        <p className="whitespace-pre-wrap text-sm text-ink-soft">{fiche.contenu}</p>
      )}
    </div>
  );
}

interface FichesManagerProps {
  type: TypeFiche;
  themePlaceholder: string;
  emptyLabel: string;
}

export function FichesManager({ type, themePlaceholder, emptyLabel }: FichesManagerProps) {
  const fiches = useFiches(type);

  return (
    <div className="flex flex-col gap-4">
      <NewFicheForm type={type} themePlaceholder={themePlaceholder} />
      {fiches.length === 0 ? (
        <p className="text-sm text-ink-soft">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {fiches.map((fiche) => (
            <FicheCard key={fiche.id} fiche={fiche} />
          ))}
        </div>
      )}
    </div>
  );
}
