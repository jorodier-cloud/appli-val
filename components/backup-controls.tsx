"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { exportAllData, importAllData } from "@/lib/store";
import { downloadTextFile } from "@/lib/markdown";
import { cn } from "@/lib/utils";

interface BackupControlsProps {
  variant?: "sidebar" | "inline";
}

/**
 * Sauvegarde manuelle de secours : tout est déjà persisté en localStorage,
 * mais un export/import JSON protège contre un vidage du cache navigateur ou
 * un changement d'appareil.
 */
export function BackupControls({ variant = "sidebar" }: BackupControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const flash = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExport = () => {
    const bundle = exportAllData();
    downloadTextFile(bundle, `riwaq-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
    flash("Téléchargement lancé");
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const text = await file.text();
    if (!confirm("Remplacer les données actuelles par cette sauvegarde ?")) return;
    const ok = importAllData(text);
    flash(ok ? "Sauvegarde restaurée" : "Fichier de sauvegarde illisible");
  };

  const buttonClass =
    variant === "sidebar"
      ? "block w-full rounded-lg bg-white/10 px-3.5 py-2 text-left text-[13px] font-medium text-[#F6E9D6] hover:bg-white/20"
      : "inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-card";

  return (
    <div className={cn("flex flex-col gap-1.5", variant === "inline" && "flex-row flex-wrap items-center")}>
      <button type="button" onClick={handleExport} className={buttonClass}>
        <Download className="inline h-3.5 w-3.5 -translate-y-px" /> Exporter une sauvegarde
      </button>
      <button type="button" onClick={handleImportClick} className={buttonClass}>
        <Upload className="inline h-3.5 w-3.5 -translate-y-px" /> Restaurer une sauvegarde
      </button>
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
      {message && <span className="text-xs text-ink-soft">{message}</span>}
    </div>
  );
}
