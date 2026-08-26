"use client";

import { useState } from "react";
import { GraduationCap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNiveaux, createNiveau } from "@/lib/store";

interface NiveauPickerProps {
  value: string | null;
  onChange: (niveauId: string | null) => void;
  disabled?: boolean;
}

export function NiveauPicker({ value, onChange, disabled }: NiveauPickerProps) {
  const niveaux = useNiveaux();
  const [isCreating, setIsCreating] = useState(false);
  const [nom, setNom] = useState("");

  const handleCreate = () => {
    if (!nom.trim()) return;
    const niveau = createNiveau(nom);
    onChange(niveau.id);
    setIsCreating(false);
    setNom("");
  };

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="niveau-picker"
        className="flex items-center gap-2 text-sm font-semibold text-ink"
      >
        <GraduationCap className="h-4 w-4 text-terracotta" />
        Niveau
      </label>

      {!isCreating && (
        <div className="flex gap-2">
          <select
            id="niveau-picker"
            value={value ?? ""}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value || null)}
            className="flex-1 rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep disabled:bg-card disabled:text-ink-soft"
          >
            <option value="">Sélectionner un niveau…</option>
            {niveaux.map((niveau) => (
              <option key={niveau.id} value={niveau.id}>
                {niveau.nom}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            disabled={disabled}
            onClick={() => setIsCreating(true)}
          >
            <Plus className="h-4 w-4" />
            Nouveau
          </Button>
        </div>
      )}

      {isCreating && (
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-card p-3">
          <input
            autoFocus
            value={nom}
            onChange={(event) => setNom(event.target.value)}
            placeholder="Ex : 3e"
            className="rounded-md border border-line bg-white p-2 text-sm text-ink placeholder:text-ink-soft focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
          />
          <div className="flex gap-2">
            <Button type="button" onClick={handleCreate} disabled={!nom.trim()}>
              Créer
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {niveaux.length === 0 && !isCreating && (
        <p className="text-xs text-ink-soft">
          Aucun niveau créé pour l&apos;instant — cliquez sur « Nouveau ».
        </p>
      )}
    </div>
  );
}
