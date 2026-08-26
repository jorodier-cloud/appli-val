"use client";

import { School } from "lucide-react";
import { useClasses, useNiveaux } from "@/lib/store";

interface ClassePickerProps {
  value: string | null;
  onChange: (classeId: string | null) => void;
  disabled?: boolean;
}

export function ClassePicker({ value, onChange, disabled }: ClassePickerProps) {
  const classes = useClasses();
  const niveaux = useNiveaux();

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="classe-picker"
        className="flex items-center gap-2 text-sm font-semibold text-ink"
      >
        <School className="h-4 w-4 text-terracotta" />
        Classe
      </label>
      <select
        id="classe-picker"
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value || null)}
        className="rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep disabled:bg-card disabled:text-ink-soft"
      >
        <option value="">Sélectionner une classe…</option>
        {classes.map((classe) => {
          const niveauNom = niveaux.find((n) => n.id === classe.niveauId)?.nom;
          return (
            <option key={classe.id} value={classe.id}>
              {classe.nom}
              {niveauNom ? ` (${niveauNom})` : ""}
            </option>
          );
        })}
      </select>
      {classes.length === 0 && (
        <p className="text-xs text-ink-soft">
          Aucune classe créée pour l&apos;instant — rendez-vous dans l&apos;onglet
          « Mes classes ».
        </p>
      )}
    </div>
  );
}
