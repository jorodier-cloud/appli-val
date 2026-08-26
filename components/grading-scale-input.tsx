"use client";

import { ClipboardList } from "lucide-react";

interface GradingScaleInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function GradingScaleInput({
  value,
  onChange,
  disabled,
}: GradingScaleInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="grading-scale"
        className="flex items-center gap-2 text-sm font-semibold text-ink"
      >
        <ClipboardList className="h-4 w-4 text-terracotta" />
        Barème et consignes
      </label>
      <textarea
        id="grading-scale"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ex : Ex 1 : 5pts - Résolution d'équation. Ex 2 : 5pts - Théorème de Pythagore."
        rows={6}
        className="resize-y rounded-lg border border-line bg-white p-3 text-sm text-ink placeholder:text-ink-soft focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep disabled:bg-card disabled:text-ink-soft"
      />
    </div>
  );
}
