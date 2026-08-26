"use client";

import { useState } from "react";
import { ClassePicker } from "@/components/classe-picker";
import { ClassesManager } from "@/components/classes-manager";
import { NotesTable } from "@/components/notes-table";
import { CompetencesGrid } from "@/components/competences-grid";
import { ConseilClasse } from "@/components/conseil-classe";
import { cn } from "@/lib/utils";

const SUB_TABS = [
  { key: "eleves", label: "Élèves & notes" },
  { key: "competences", label: "Compétences" },
  { key: "vie-classe", label: "Vie de classe" },
] as const;

type SubTab = (typeof SUB_TABS)[number]["key"];

export function ClassesHub() {
  const [classeId, setClasseId] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<SubTab>("eleves");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Classes et élèves
        </h2>
        <ClassesManager />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Suivi par classe
        </h2>
        <div className="rounded-xl border border-line bg-card p-4">
          <ClassePicker value={classeId} onChange={setClasseId} />
        </div>

        {classeId && (
          <>
            <div className="flex gap-1 border-b border-line">
              {SUB_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSubTab(tab.key)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors",
                    subTab === tab.key
                      ? "border-b-2 border-terracotta font-semibold text-terracotta-deep"
                      : "text-ink-soft hover:text-ink"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {subTab === "eleves" && <NotesTable classeId={classeId} />}
            {subTab === "competences" && <CompetencesGrid classeId={classeId} />}
            {subTab === "vie-classe" && <ConseilClasse classeId={classeId} />}
          </>
        )}
      </div>
    </div>
  );
}
