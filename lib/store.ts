"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Niveau, ProgressionItem } from "@/types/pedagogie";
import type { Ressource, TypeRessource } from "@/types/contenu";
import type { EvaluationSuivi, NoteEleve } from "@/types/evaluation";

interface StoreState {
  niveaux: Niveau[];
  progressionItems: ProgressionItem[];
  ressources: Ressource[];
  evaluations: EvaluationSuivi[];
}

const STORAGE_KEY = "riwaq:store:v2";

const EMPTY_STATE: StoreState = {
  niveaux: [],
  progressionItems: [],
  ressources: [],
  evaluations: [],
};

let state: StoreState = EMPTY_STATE;
let hydrated = false;
const listeners = new Set<() => void>();

function loadFromStorage() {
  hydrated = true;
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    // Fusionné sur EMPTY_STATE : une donnée persistée avant l'ajout d'un champ
    // ne doit pas faire planter les filtres sur un tableau `undefined`.
    if (raw) state = { ...EMPTY_STATE, ...(JSON.parse(raw) as Partial<StoreState>) };
  } catch {
    // localStorage indisponible ou corrompu : on reste sur l'état vide.
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota dépassé ou stockage désactivé : la session continue en mémoire.
  }
}

function setState(next: StoreState) {
  state = next;
  persist();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): StoreState {
  if (!hydrated) loadFromStorage();
  return state;
}

function getServerSnapshot(): StoreState {
  return EMPTY_STATE;
}

function useStoreState(): StoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function id() {
  return crypto.randomUUID();
}

// --- Niveaux & progression ------------------------------------------------

export function createNiveau(nom: string): Niveau {
  const niveau: Niveau = { id: id(), nom: nom.trim() };
  setState({ ...state, niveaux: [...state.niveaux, niveau] });
  return niveau;
}

export function deleteNiveau(niveauId: string) {
  setState({
    ...state,
    niveaux: state.niveaux.filter((n) => n.id !== niveauId),
    progressionItems: state.progressionItems.filter((p) => p.niveauId !== niveauId),
    evaluations: state.evaluations.filter((e) => e.niveauId !== niveauId),
  });
}

export type ProgressionItemDraft = { titre: string; periode: string };

/**
 * Remplace la progression complète d'un niveau à partir d'une saisie en masse
 * (import fichier ou textarea) : les chapitres dont le titre correspond déjà
 * (insensible à la casse) conservent leur id et leur statut "traité".
 */
export function setProgressionForNiveau(niveauId: string, drafts: ProgressionItemDraft[]) {
  const existing = state.progressionItems.filter((p) => p.niveauId === niveauId);
  const items: ProgressionItem[] = drafts.map((draft, index) => {
    const prev = existing.find((p) => p.titre.toLowerCase() === draft.titre.toLowerCase());
    return {
      id: prev?.id ?? id(),
      niveauId,
      ordre: index + 1,
      titre: draft.titre,
      periode: draft.periode,
      traite: prev?.traite ?? false,
    };
  });
  setState({
    ...state,
    progressionItems: [
      ...state.progressionItems.filter((p) => p.niveauId !== niveauId),
      ...items,
    ],
  });
}

export function updateProgressionItem(
  itemId: string,
  patch: Partial<Pick<ProgressionItem, "titre" | "periode" | "traite">>
) {
  setState({
    ...state,
    progressionItems: state.progressionItems.map((p) =>
      p.id === itemId ? { ...p, ...patch } : p
    ),
  });
}

export function removeProgressionItem(itemId: string) {
  setState({
    ...state,
    progressionItems: state.progressionItems.filter((p) => p.id !== itemId),
  });
}

/** Réassigne `ordre` (1..n) selon l'ordre de `orderedIds` — utilisé après un glisser-déposer. */
export function reorderProgression(niveauId: string, orderedIds: string[]) {
  const ordreById = new Map(orderedIds.map((itemId, index) => [itemId, index + 1]));
  setState({
    ...state,
    progressionItems: state.progressionItems.map((p) =>
      p.niveauId === niveauId && ordreById.has(p.id)
        ? { ...p, ordre: ordreById.get(p.id)! }
        : p
    ),
  });
}

export function moveProgressionItem(niveauId: string, itemId: string, direction: -1 | 1) {
  const items = state.progressionItems
    .filter((p) => p.niveauId === niveauId)
    .sort((a, b) => a.ordre - b.ordre);
  const index = items.findIndex((p) => p.id === itemId);
  const swapIndex = index + direction;
  if (index === -1 || swapIndex < 0 || swapIndex >= items.length) return;
  const orderedIds = items.map((p) => p.id);
  [orderedIds[index], orderedIds[swapIndex]] = [orderedIds[swapIndex]!, orderedIds[index]!];
  reorderProgression(niveauId, orderedIds);
}

// --- Ressources générées ---------------------------------------------------

export function addRessource(input: {
  type: TypeRessource;
  niveauNom: string;
  chapitreTitre: string;
  notes: string;
  contenu: string;
}): Ressource {
  const ressource: Ressource = { ...input, id: id(), createdAtISO: new Date().toISOString() };
  setState({ ...state, ressources: [...state.ressources, ressource] });
  return ressource;
}

export function removeRessource(ressourceId: string) {
  setState({
    ...state,
    ressources: state.ressources.filter((r) => r.id !== ressourceId),
    evaluations: state.evaluations.map((e) =>
      e.corrigeRessourceId === ressourceId ? { ...e, corrigeRessourceId: null } : e
    ),
  });
}

// --- Évaluations suivies ----------------------------------------------------

export function createEvaluation(input: {
  niveauId: string;
  titre: string;
  dateEvalISO: string;
  sujet: string;
  eleves: NoteEleve[];
}): EvaluationSuivi {
  const evaluation: EvaluationSuivi = {
    id: id(),
    niveauId: input.niveauId,
    titre: input.titre.trim(),
    dateEvalISO: input.dateEvalISO,
    sujet: input.sujet.trim(),
    eleves: input.eleves,
    notionsRatees: "",
    corrigeRessourceId: null,
    restituee: false,
    dateRestitutionISO: null,
  };
  setState({ ...state, evaluations: [...state.evaluations, evaluation] });
  return evaluation;
}

export function updateEvaluation(
  evaluationId: string,
  patch: Partial<
    Pick<EvaluationSuivi, "niveauId" | "titre" | "dateEvalISO" | "sujet" | "eleves">
  >
) {
  setState({
    ...state,
    evaluations: state.evaluations.map((e) =>
      e.id === evaluationId ? { ...e, ...patch } : e
    ),
  });
}

export function updateEvaluationNotionsRatees(evaluationId: string, notionsRatees: string) {
  setState({
    ...state,
    evaluations: state.evaluations.map((e) =>
      e.id === evaluationId ? { ...e, notionsRatees } : e
    ),
  });
}

export function setEvaluationCorrige(evaluationId: string, ressourceId: string) {
  setState({
    ...state,
    evaluations: state.evaluations.map((e) =>
      e.id === evaluationId ? { ...e, corrigeRessourceId: ressourceId } : e
    ),
  });
}

export function marquerEvaluationRestituee(evaluationId: string) {
  setState({
    ...state,
    evaluations: state.evaluations.map((e) =>
      e.id === evaluationId
        ? { ...e, restituee: true, dateRestitutionISO: new Date().toISOString() }
        : e
    ),
  });
}

export function removeEvaluation(evaluationId: string) {
  setState({ ...state, evaluations: state.evaluations.filter((e) => e.id !== evaluationId) });
}

// --- Sauvegarde manuelle -----------------------------------------------------

export function exportAllData(): string {
  return JSON.stringify(state, null, 2);
}

export function importAllData(json: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return false;
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as Partial<StoreState>).niveaux)
  ) {
    return false;
  }
  setState({ ...EMPTY_STATE, ...(parsed as Partial<StoreState>) });
  return true;
}

// --- Sélecteurs --------------------------------------------------------------

export function useNiveaux(): Niveau[] {
  return useStoreState().niveaux;
}

export function useAllProgressionItems(): ProgressionItem[] {
  return useStoreState().progressionItems;
}

export function useProgression(niveauId: string | null): ProgressionItem[] {
  const { progressionItems } = useStoreState();
  return useMemo(
    () =>
      niveauId
        ? progressionItems
            .filter((p) => p.niveauId === niveauId)
            .sort((a, b) => a.ordre - b.ordre)
        : [],
    [progressionItems, niveauId]
  );
}

export function useAllRessources(): Ressource[] {
  return useStoreState().ressources;
}

export function useRessource(ressourceId: string | null): Ressource | null {
  const { ressources } = useStoreState();
  return useMemo(
    () => ressources.find((r) => r.id === ressourceId) ?? null,
    [ressources, ressourceId]
  );
}

export function useAllEvaluations(): EvaluationSuivi[] {
  return useStoreState().evaluations;
}
