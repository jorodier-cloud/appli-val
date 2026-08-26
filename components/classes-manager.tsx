"use client";

import { useState } from "react";
import { Plus, School, Trash2, UserPlus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NiveauPicker } from "@/components/niveau-picker";
import {
  useClasses,
  useEleves,
  useNiveaux,
  createClasse,
  deleteClasse,
  addEleve,
  removeEleve,
} from "@/lib/store";

function NewClasseForm() {
  const [nom, setNom] = useState("");
  const [niveauId, setNiveauId] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!nom.trim()) return;
    createClasse(nom, niveauId);
    setNom("");
  };

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-card p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="new-classe-nom" className="text-xs font-medium text-ink-soft">
          Nom de la classe
        </label>
        <input
          id="new-classe-nom"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          placeholder="Ex : 3e2"
          className="rounded-md border border-line bg-white p-2 text-sm text-ink placeholder:text-ink-soft focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
        />
      </div>
      <div className="min-w-[14rem]">
        <NiveauPicker value={niveauId} onChange={setNiveauId} />
      </div>
      <Button onClick={handleSubmit} disabled={!nom.trim()}>
        <Plus className="h-4 w-4" />
        Créer la classe
      </Button>
    </div>
  );
}

function NewEleveForm({ classeId }: { classeId: string }) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");

  const handleSubmit = () => {
    if (!prenom.trim() || !nom.trim()) return;
    addEleve(classeId, prenom, nom);
    setPrenom("");
    setNom("");
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <input
        value={prenom}
        onChange={(event) => setPrenom(event.target.value)}
        placeholder="Prénom"
        className="w-32 rounded-md border border-line bg-white p-2 text-sm text-ink placeholder:text-ink-soft focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
      />
      <input
        value={nom}
        onChange={(event) => setNom(event.target.value)}
        placeholder="Nom"
        className="w-32 rounded-md border border-line bg-white p-2 text-sm text-ink placeholder:text-ink-soft focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
      />
      <Button
        variant="secondary"
        onClick={handleSubmit}
        disabled={!prenom.trim() || !nom.trim()}
      >
        <UserPlus className="h-4 w-4" />
        Ajouter
      </Button>
    </div>
  );
}

function ClasseCard({ classeId }: { classeId: string }) {
  const classes = useClasses();
  const niveaux = useNiveaux();
  const eleves = useEleves(classeId);
  const classe = classes.find((c) => c.id === classeId);
  if (!classe) return null;
  const niveauNom = niveaux.find((n) => n.id === classe.niveauId)?.nom ?? "Niveau non renseigné";

  const handleDelete = () => {
    if (
      confirm(
        `Supprimer la classe « ${classe.nom} » ? Ses élèves, évaluations et notes seront aussi supprimés.`
      )
    ) {
      deleteClasse(classeId);
    }
  };

  return (
    <div
      className="arch-top flex flex-col gap-4 rounded-2xl border border-line bg-card p-5 shadow-[var(--shadow-riwaq)]"
      style={{ ["--arch-color" as string]: "var(--color-sauge)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <School className="h-5 w-5 text-terracotta" />
          <div>
            <h3 className="text-sm font-semibold text-ink">{classe.nom}</h3>
            <p className="text-xs text-ink-soft">{niveauNom}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-md p-1.5 text-ink-soft hover:bg-rose-50 hover:text-rose-600"
          aria-label={`Supprimer la classe ${classe.nom}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <ul className="flex flex-col divide-y divide-line">
        {eleves.map((eleve) => (
          <li
            key={eleve.id}
            className="flex items-center justify-between gap-2 py-2 text-sm text-ink"
          >
            <span className="flex items-center gap-2">
              <UserRound className="h-3.5 w-3.5 text-ink-soft" />
              {eleve.prenom} {eleve.nom}
            </span>
            <button
              type="button"
              onClick={() => removeEleve(eleve.id)}
              className="rounded-md p-1 text-ink-soft hover:bg-rose-50 hover:text-rose-600"
              aria-label={`Retirer ${eleve.prenom} ${eleve.nom}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        {eleves.length === 0 && (
          <li className="py-2 text-sm text-ink-soft">Aucun élève pour l&apos;instant.</li>
        )}
      </ul>

      <NewEleveForm classeId={classeId} />
    </div>
  );
}

export function ClassesManager() {
  const classes = useClasses();

  return (
    <div className="flex flex-col gap-6">
      <NewClasseForm />

      {classes.length === 0 ? (
        <p className="text-sm text-ink-soft">
          Aucune classe créée pour l&apos;instant — commencez par en créer une ci-dessus.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {classes.map((classe) => (
            <ClasseCard key={classe.id} classeId={classe.id} />
          ))}
        </div>
      )}
    </div>
  );
}
