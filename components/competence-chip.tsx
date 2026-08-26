"use client";

import { useEvaluationCompetence, setEvaluationCompetence } from "@/lib/store";
import { nextNiveauCompetence } from "@/lib/competences";
import { cn } from "@/lib/utils";
import type { Competence } from "@/types/competences";
import type { NiveauCompetence } from "@/types/competences";

const TONE: Record<NiveauCompetence, string> = {
  D: "bg-sauge/15 text-sauge border-sauge-light",
  A: "bg-ochre/20 text-[#8A6414] border-ochre",
  PA: "bg-terracotta/15 text-terracotta-deep border-terracotta",
  NA: "bg-[#EAD9D2] text-[#7A3D2C] border-[#c98d75]",
};

const LABEL: Record<NiveauCompetence, string> = {
  D: "Dépassé",
  A: "Acquis",
  PA: "En cours",
  NA: "Non acquis",
};

interface CompetenceChipProps {
  competence: Competence;
  eleveId: string;
}

/**
 * Chip cliquable qui cycle D → A → PA → NA → D. Pas d'état "non évalué" distinct
 * pour rester à 4 états simples comme dans la maquette — tant que le prof n'a pas
 * cliqué, la compétence s'affiche à "NA" par défaut (premier clic la fait
 * progresser).
 */
export function CompetenceChip({ competence, eleveId }: CompetenceChipProps) {
  const current = useEvaluationCompetence(competence.id, eleveId);
  const niveau = current?.niveau ?? "NA";

  const handleClick = () => {
    setEvaluationCompetence(competence.id, eleveId, nextNiveauCompetence(niveau));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`${competence.nom} — cliquer pour changer le niveau`}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
        TONE[niveau]
      )}
    >
      {competence.nom} · {LABEL[niveau]}
    </button>
  );
}
