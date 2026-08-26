"use client";

import { useMemo, useState } from "react";
import { BookOpen, ClipboardCheck, FileText, PencilRuler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FichesManager } from "@/components/fiches-manager";
import {
  useNiveaux,
  useAllProgressionItems,
  useAllSupportsCours,
  useAllFichesExercices,
  useAllEvaluationsGenerees,
} from "@/lib/store";

interface ContenuCard {
  id: string;
  icon: typeof BookOpen;
  typeLabel: string;
  niveauNom: string;
  chapitreTitre: string;
  createdAtISO: string;
}

function useContenuGenere(): ContenuCard[] {
  const niveaux = useNiveaux();
  const progressionItems = useAllProgressionItems();
  const supportsCours = useAllSupportsCours();
  const fichesExercices = useAllFichesExercices();
  const evaluationsGenerees = useAllEvaluationsGenerees();

  return useMemo(() => {
    const niveauNomByItemId = new Map(
      progressionItems.map((item) => [
        item.id,
        { niveauNom: niveaux.find((n) => n.id === item.niveauId)?.nom ?? "?", titre: item.titre },
      ])
    );

    const cards: ContenuCard[] = [];

    supportsCours.forEach((s) => {
      const ctx = niveauNomByItemId.get(s.progressionItemId);
      if (!ctx) return;
      cards.push({
        id: s.id,
        icon: BookOpen,
        typeLabel: "Support de cours",
        niveauNom: ctx.niveauNom,
        chapitreTitre: ctx.titre,
        createdAtISO: s.createdAtISO,
      });
    });

    fichesExercices.forEach((f) => {
      const ctx = niveauNomByItemId.get(f.progressionItemId);
      if (!ctx) return;
      cards.push({
        id: f.id,
        icon: PencilRuler,
        typeLabel: "Fiche d'exercices",
        niveauNom: ctx.niveauNom,
        chapitreTitre: ctx.titre,
        createdAtISO: f.createdAtISO,
      });
    });

    evaluationsGenerees.forEach((e) => {
      const ctx = niveauNomByItemId.get(e.progressionItemId);
      if (!ctx) return;
      cards.push({
        id: e.id,
        icon: ClipboardCheck,
        typeLabel: "Évaluation générée",
        niveauNom: ctx.niveauNom,
        chapitreTitre: ctx.titre,
        createdAtISO: e.createdAtISO,
      });
    });

    return cards.sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO));
  }, [niveaux, progressionItems, supportsCours, fichesExercices, evaluationsGenerees]);
}

function ContenuGenereSection() {
  const cards = useContenuGenere();
  const [filtreNiveau, setFiltreNiveau] = useState("");

  const niveauxDisponibles = useMemo(
    () => Array.from(new Set(cards.map((c) => c.niveauNom))).sort(),
    [cards]
  );

  const filtered = filtreNiveau ? cards.filter((c) => c.niveauNom === filtreNiveau) : cards;

  if (cards.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        Aucun contenu généré pour l&apos;instant — rendez-vous dans l&apos;onglet
        « Générateur de supports ».
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {niveauxDisponibles.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFiltreNiveau("")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filtreNiveau === ""
                ? "border-terracotta bg-terracotta/10 text-terracotta-deep"
                : "border-line text-ink-soft hover:bg-card"
            }`}
          >
            Tous les niveaux
          </button>
          {niveauxDisponibles.map((niveauNom) => (
            <button
              key={niveauNom}
              type="button"
              onClick={() => setFiltreNiveau(niveauNom)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filtreNiveau === niveauNom
                  ? "border-terracotta bg-terracotta/10 text-terracotta-deep"
                  : "border-line text-ink-soft hover:bg-card"
              }`}
            >
              {niveauNom}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.id} className="rounded-xl border border-line bg-card p-4">
              <span className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-terracotta-deep">
                <Icon className="h-3.5 w-3.5" />
                {card.niveauNom} · {card.typeLabel}
              </span>
              <h3 className="text-sm font-semibold text-ink">{card.chapitreTitre}</h3>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BanqueRessources() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-soft">
          <FileText className="h-4 w-4" />
          Contenu pédagogique généré
        </h2>
        <ContenuGenereSection />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Fiches gestion de classe
        </h2>
        <FichesManager
          type="gestion-classe"
          themePlaceholder="Thème (ex : Autorité, Différenciation, Élèves à besoins particuliers…)"
          emptyLabel="Aucune fiche pour l'instant — créez-en une ci-dessus."
        />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Fiches méthodologiques — apprendre à apprendre
        </h2>
        <FichesManager
          type="methodologie"
          themePlaceholder="Thème (ex : Organisation, Mémorisation, Gestion du stress…)"
          emptyLabel="Aucune fiche méthodologique pour l'instant — créez-en une ci-dessus."
        />
      </div>
    </div>
  );
}
