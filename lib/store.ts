"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Classe, Eleve, Evaluation, Note } from "@/types/domain";
import type {
  Niveau,
  ProgressionItem,
  QuestionFlash,
  TestReactivation,
} from "@/types/pedagogie";
import type {
  BlocCours,
  Exercice,
  ExerciceEvalue,
  EvaluationGeneree,
  FicheExercices,
  SupportCours,
} from "@/types/contenu";
import type { Fiche, TypeFiche } from "@/types/fiches";
import type { BilanConseilClasse } from "@/types/vie-classe";
import type { RevisionPlanItem } from "@/types/revision";
import type { RevisionPlanDraft } from "@/lib/revision-plan";
import type { Competence, EvaluationCompetence, NiveauCompetence } from "@/types/competences";

interface StoreState {
  classes: Classe[];
  eleves: Eleve[];
  evaluations: Evaluation[];
  notes: Note[];
  niveaux: Niveau[];
  progressionItems: ProgressionItem[];
  questionsFlash: QuestionFlash[];
  testsReactivation: TestReactivation[];
  supportsCours: SupportCours[];
  fichesExercices: FicheExercices[];
  evaluationsGenerees: EvaluationGeneree[];
  fiches: Fiche[];
  bilansConseilClasse: BilanConseilClasse[];
  revisionPlans: RevisionPlanItem[];
  competences: Competence[];
  evaluationCompetences: EvaluationCompetence[];
}

const STORAGE_KEY = "eduteach-ai:store:v1";

const EMPTY_STATE: StoreState = {
  classes: [],
  eleves: [],
  evaluations: [],
  notes: [],
  niveaux: [],
  progressionItems: [],
  questionsFlash: [],
  testsReactivation: [],
  supportsCours: [],
  fichesExercices: [],
  evaluationsGenerees: [],
  fiches: [],
  bilansConseilClasse: [],
  revisionPlans: [],
  competences: [],
  evaluationCompetences: [],
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
    // (ex. niveaux, arrivés au Lot 2) ne doit pas faire planter les filtres sur
    // un tableau `undefined`.
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

// --- Mutations ---------------------------------------------------------

export function createClasse(nom: string, niveauId: string | null): Classe {
  const classe: Classe = { id: id(), nom: nom.trim(), niveauId };
  setState({ ...state, classes: [...state.classes, classe] });
  return classe;
}

export function deleteClasse(classeId: string) {
  const evaluationIds = new Set(
    state.evaluations.filter((e) => e.classeId === classeId).map((e) => e.id)
  );
  const competenceIds = new Set(
    state.competences.filter((c) => evaluationIds.has(c.evaluationId)).map((c) => c.id)
  );
  setState({
    ...state,
    classes: state.classes.filter((c) => c.id !== classeId),
    eleves: state.eleves.filter((e) => e.classeId !== classeId),
    evaluations: state.evaluations.filter((e) => e.classeId !== classeId),
    notes: state.notes.filter((n) => !evaluationIds.has(n.evaluationId)),
    bilansConseilClasse: state.bilansConseilClasse.filter((b) => b.classeId !== classeId),
    competences: state.competences.filter((c) => !evaluationIds.has(c.evaluationId)),
    evaluationCompetences: state.evaluationCompetences.filter(
      (ec) => !competenceIds.has(ec.competenceId)
    ),
  });
}

export function addEleve(classeId: string, prenom: string, nom: string): Eleve {
  const eleve: Eleve = {
    id: id(),
    classeId,
    prenom: prenom.trim(),
    nom: nom.trim(),
  };
  setState({ ...state, eleves: [...state.eleves, eleve] });
  return eleve;
}

export function removeEleve(eleveId: string) {
  setState({
    ...state,
    eleves: state.eleves.filter((e) => e.id !== eleveId),
    notes: state.notes.filter((n) => n.eleveId !== eleveId),
    evaluationCompetences: state.evaluationCompetences.filter((ec) => ec.eleveId !== eleveId),
  });
}

export function createEvaluation(
  classeId: string,
  titre: string,
  bareme: string,
  dateISO: string
): Evaluation {
  const evaluation: Evaluation = {
    id: id(),
    classeId,
    titre: titre.trim(),
    bareme,
    dateISO,
    maxTotalScore: null,
  };
  setState({ ...state, evaluations: [...state.evaluations, evaluation] });
  return evaluation;
}

export function updateEvaluationBareme(evaluationId: string, bareme: string) {
  setState({
    ...state,
    evaluations: state.evaluations.map((e) =>
      e.id === evaluationId ? { ...e, bareme } : e
    ),
  });
}

export function upsertNote(input: Omit<Note, "id" | "updatedAtISO">): Note {
  const existing = state.notes.find(
    (n) => n.evaluationId === input.evaluationId && n.eleveId === input.eleveId
  );
  const note: Note = {
    ...input,
    id: existing?.id ?? id(),
    updatedAtISO: new Date().toISOString(),
  };

  const notes = existing
    ? state.notes.map((n) => (n.id === existing.id ? note : n))
    : [...state.notes, note];

  const evaluations = state.evaluations.map((e) =>
    e.id === input.evaluationId && e.maxTotalScore === null
      ? { ...e, maxTotalScore: input.maxTotalScore }
      : e
  );

  setState({ ...state, notes, evaluations });
  return note;
}

export function deleteNote(noteId: string) {
  setState({ ...state, notes: state.notes.filter((n) => n.id !== noteId) });
}

export function createNiveau(nom: string): Niveau {
  const niveau: Niveau = { id: id(), nom: nom.trim() };
  setState({ ...state, niveaux: [...state.niveaux, niveau] });
  return niveau;
}

export function deleteNiveau(niveauId: string) {
  const progressionItemIds = new Set(
    state.progressionItems.filter((p) => p.niveauId === niveauId).map((p) => p.id)
  );
  setState({
    ...state,
    niveaux: state.niveaux.filter((n) => n.id !== niveauId),
    progressionItems: state.progressionItems.filter((p) => p.niveauId !== niveauId),
    questionsFlash: state.questionsFlash.filter(
      (q) => !progressionItemIds.has(q.progressionItemId)
    ),
    testsReactivation: state.testsReactivation.filter((t) => t.niveauId !== niveauId),
    supportsCours: state.supportsCours.filter(
      (s) => !progressionItemIds.has(s.progressionItemId)
    ),
    fichesExercices: state.fichesExercices.filter(
      (f) => !progressionItemIds.has(f.progressionItemId)
    ),
    evaluationsGenerees: state.evaluationsGenerees.filter(
      (e) => !progressionItemIds.has(e.progressionItemId)
    ),
    revisionPlans: state.revisionPlans.filter(
      (r) => !progressionItemIds.has(r.progressionItemId)
    ),
  });
}

export function addProgressionItem(
  niveauId: string,
  titre: string,
  dateISO: string
): ProgressionItem {
  const maxOrdre = state.progressionItems
    .filter((p) => p.niveauId === niveauId)
    .reduce((max, p) => Math.max(max, p.ordre), 0);

  const item: ProgressionItem = {
    id: id(),
    niveauId,
    ordre: maxOrdre + 1,
    titre: titre.trim(),
    dateISO,
  };
  setState({ ...state, progressionItems: [...state.progressionItems, item] });
  return item;
}

export function removeProgressionItem(progressionItemId: string) {
  setState({
    ...state,
    progressionItems: state.progressionItems.filter((p) => p.id !== progressionItemId),
    questionsFlash: state.questionsFlash.filter(
      (q) => q.progressionItemId !== progressionItemId
    ),
    supportsCours: state.supportsCours.filter(
      (s) => s.progressionItemId !== progressionItemId
    ),
    fichesExercices: state.fichesExercices.filter(
      (f) => f.progressionItemId !== progressionItemId
    ),
    evaluationsGenerees: state.evaluationsGenerees.filter(
      (e) => e.progressionItemId !== progressionItemId
    ),
    revisionPlans: state.revisionPlans.filter(
      (r) => r.progressionItemId !== progressionItemId
    ),
  });
}

export function addQuestionsFlash(
  niveauId: string,
  progressionItemId: string,
  items: { enonce: string; reponse: string }[]
): QuestionFlash[] {
  const createdAtISO = new Date().toISOString();
  const questions: QuestionFlash[] = items.map((item) => ({
    id: id(),
    niveauId,
    progressionItemId,
    enonce: item.enonce,
    reponse: item.reponse,
    createdAtISO,
  }));
  setState({ ...state, questionsFlash: [...state.questionsFlash, ...questions] });
  return questions;
}

export function removeQuestionFlash(questionId: string) {
  setState({
    ...state,
    questionsFlash: state.questionsFlash.filter((q) => q.id !== questionId),
  });
}

export function createTestReactivation(
  niveauId: string,
  seance: number,
  questionIds: string[]
): TestReactivation {
  const test: TestReactivation = {
    id: id(),
    niveauId,
    seance,
    questionIds,
    createdAtISO: new Date().toISOString(),
  };
  setState({ ...state, testsReactivation: [...state.testsReactivation, test] });
  return test;
}

export function setSupportCours(
  progressionItemId: string,
  introduction: string,
  blocs: BlocCours[]
): SupportCours {
  const support: SupportCours = {
    id: id(),
    progressionItemId,
    introduction,
    blocs,
    createdAtISO: new Date().toISOString(),
  };
  setState({
    ...state,
    supportsCours: [
      ...state.supportsCours.filter((s) => s.progressionItemId !== progressionItemId),
      support,
    ],
  });
  return support;
}

export function setFicheExercices(
  progressionItemId: string,
  exercices: Exercice[]
): FicheExercices {
  const fiche: FicheExercices = {
    id: id(),
    progressionItemId,
    exercices,
    createdAtISO: new Date().toISOString(),
  };
  setState({
    ...state,
    fichesExercices: [
      ...state.fichesExercices.filter((f) => f.progressionItemId !== progressionItemId),
      fiche,
    ],
  });
  return fiche;
}

export function setEvaluationGeneree(
  progressionItemId: string,
  exercices: ExerciceEvalue[]
): EvaluationGeneree {
  const evaluation: EvaluationGeneree = {
    id: id(),
    progressionItemId,
    exercices,
    createdAtISO: new Date().toISOString(),
  };
  setState({
    ...state,
    evaluationsGenerees: [
      ...state.evaluationsGenerees.filter((e) => e.progressionItemId !== progressionItemId),
      evaluation,
    ],
  });
  return evaluation;
}

export function createFiche(
  type: TypeFiche,
  titre: string,
  theme: string,
  contenu: string
): Fiche {
  const fiche: Fiche = {
    id: id(),
    type,
    titre: titre.trim(),
    theme: theme.trim(),
    contenu,
    updatedAtISO: new Date().toISOString(),
  };
  setState({ ...state, fiches: [...state.fiches, fiche] });
  return fiche;
}

export function updateFiche(
  ficheId: string,
  patch: Partial<Pick<Fiche, "titre" | "theme" | "contenu">>
) {
  setState({
    ...state,
    fiches: state.fiches.map((f) =>
      f.id === ficheId ? { ...f, ...patch, updatedAtISO: new Date().toISOString() } : f
    ),
  });
}

export function deleteFiche(ficheId: string) {
  setState({ ...state, fiches: state.fiches.filter((f) => f.id !== ficheId) });
}

export function createBilanConseilClasse(
  classeId: string,
  dateISO: string,
  pointsPositifs: string,
  pointsVigilance: string,
  decisions: string
): BilanConseilClasse {
  const bilan: BilanConseilClasse = {
    id: id(),
    classeId,
    dateISO,
    pointsPositifs,
    pointsVigilance,
    decisions,
    createdAtISO: new Date().toISOString(),
  };
  setState({ ...state, bilansConseilClasse: [...state.bilansConseilClasse, bilan] });
  return bilan;
}

export function deleteBilanConseilClasse(bilanId: string) {
  setState({
    ...state,
    bilansConseilClasse: state.bilansConseilClasse.filter((b) => b.id !== bilanId),
  });
}

export function setRevisionPlan(
  progressionItemId: string,
  items: RevisionPlanDraft[]
): RevisionPlanItem[] {
  const createdAtISO = new Date().toISOString();
  const newItems: RevisionPlanItem[] = items.map((item) => ({
    ...item,
    id: id(),
    createdAtISO,
  }));
  setState({
    ...state,
    revisionPlans: [
      ...state.revisionPlans.filter((r) => r.progressionItemId !== progressionItemId),
      ...newItems,
    ],
  });
  return newItems;
}

export function createCompetence(evaluationId: string, nom: string): Competence {
  const maxOrdre = state.competences
    .filter((c) => c.evaluationId === evaluationId)
    .reduce((max, c) => Math.max(max, c.ordre), 0);
  const competence: Competence = {
    id: id(),
    evaluationId,
    nom: nom.trim(),
    ordre: maxOrdre + 1,
  };
  setState({ ...state, competences: [...state.competences, competence] });
  return competence;
}

export function removeCompetence(competenceId: string) {
  setState({
    ...state,
    competences: state.competences.filter((c) => c.id !== competenceId),
    evaluationCompetences: state.evaluationCompetences.filter(
      (ec) => ec.competenceId !== competenceId
    ),
  });
}

export function setEvaluationCompetence(
  competenceId: string,
  eleveId: string,
  niveau: NiveauCompetence
): EvaluationCompetence {
  const existing = state.evaluationCompetences.find(
    (ec) => ec.competenceId === competenceId && ec.eleveId === eleveId
  );
  const record: EvaluationCompetence = {
    id: existing?.id ?? id(),
    competenceId,
    eleveId,
    niveau,
    updatedAtISO: new Date().toISOString(),
  };
  const evaluationCompetences = existing
    ? state.evaluationCompetences.map((ec) => (ec.id === existing.id ? record : ec))
    : [...state.evaluationCompetences, record];

  setState({ ...state, evaluationCompetences });
  return record;
}

// --- Sélecteurs ----------------------------------------------------------

export function useClasses(): Classe[] {
  return useStoreState().classes;
}

export function useAllEleves(): Eleve[] {
  return useStoreState().eleves;
}

export function useAllNotes(): Note[] {
  return useStoreState().notes;
}

export function useAllEvaluations(): Evaluation[] {
  return useStoreState().evaluations;
}

export function useAllEvaluationCompetences(): EvaluationCompetence[] {
  return useStoreState().evaluationCompetences;
}

export function useEleves(classeId: string | null): Eleve[] {
  const { eleves } = useStoreState();
  return useMemo(
    () => (classeId ? eleves.filter((e) => e.classeId === classeId) : []),
    [eleves, classeId]
  );
}

export function useEvaluations(classeId: string | null): Evaluation[] {
  const { evaluations } = useStoreState();
  return useMemo(
    () => (classeId ? evaluations.filter((e) => e.classeId === classeId) : []),
    [evaluations, classeId]
  );
}

export function useNotes(evaluationId: string | null): Note[] {
  const { notes } = useStoreState();
  return useMemo(
    () => (evaluationId ? notes.filter((n) => n.evaluationId === evaluationId) : []),
    [notes, evaluationId]
  );
}

export function useNotesForClasse(classeId: string | null): Note[] {
  const { notes, evaluations } = useStoreState();
  return useMemo(() => {
    if (!classeId) return [];
    const evaluationIds = new Set(
      evaluations.filter((e) => e.classeId === classeId).map((e) => e.id)
    );
    return notes.filter((n) => evaluationIds.has(n.evaluationId));
  }, [notes, evaluations, classeId]);
}

export function useNote(
  evaluationId: string | null,
  eleveId: string | null
): Note | null {
  const notes = useNotes(evaluationId);
  return useMemo(
    () => notes.find((n) => n.eleveId === eleveId) ?? null,
    [notes, eleveId]
  );
}

export function useNiveaux(): Niveau[] {
  return useStoreState().niveaux;
}

export function useAllProgressionItems(): ProgressionItem[] {
  return useStoreState().progressionItems;
}

export function useAllSupportsCours(): SupportCours[] {
  return useStoreState().supportsCours;
}

export function useAllFichesExercices(): FicheExercices[] {
  return useStoreState().fichesExercices;
}

export function useAllEvaluationsGenerees(): EvaluationGeneree[] {
  return useStoreState().evaluationsGenerees;
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

export function useQuestionsFlash(niveauId: string | null): QuestionFlash[] {
  const { questionsFlash } = useStoreState();
  return useMemo(
    () => (niveauId ? questionsFlash.filter((q) => q.niveauId === niveauId) : []),
    [questionsFlash, niveauId]
  );
}

export function useQuestionsFlashForChapitre(
  progressionItemId: string | null
): QuestionFlash[] {
  const { questionsFlash } = useStoreState();
  return useMemo(
    () =>
      progressionItemId
        ? questionsFlash.filter((q) => q.progressionItemId === progressionItemId)
        : [],
    [questionsFlash, progressionItemId]
  );
}

export function useTestsReactivation(niveauId: string | null): TestReactivation[] {
  const { testsReactivation } = useStoreState();
  return useMemo(
    () =>
      niveauId
        ? testsReactivation
            .filter((t) => t.niveauId === niveauId)
            .sort((a, b) => a.seance - b.seance)
        : [],
    [testsReactivation, niveauId]
  );
}

export function useSupportCours(progressionItemId: string | null): SupportCours | null {
  const { supportsCours } = useStoreState();
  return useMemo(
    () => supportsCours.find((s) => s.progressionItemId === progressionItemId) ?? null,
    [supportsCours, progressionItemId]
  );
}

export function useFicheExercices(progressionItemId: string | null): FicheExercices | null {
  const { fichesExercices } = useStoreState();
  return useMemo(
    () => fichesExercices.find((f) => f.progressionItemId === progressionItemId) ?? null,
    [fichesExercices, progressionItemId]
  );
}

export function useEvaluationGeneree(
  progressionItemId: string | null
): EvaluationGeneree | null {
  const { evaluationsGenerees } = useStoreState();
  return useMemo(
    () => evaluationsGenerees.find((e) => e.progressionItemId === progressionItemId) ?? null,
    [evaluationsGenerees, progressionItemId]
  );
}

export function useFiches(type: TypeFiche): Fiche[] {
  const { fiches } = useStoreState();
  return useMemo(
    () =>
      fiches
        .filter((f) => f.type === type)
        .sort((a, b) => a.theme.localeCompare(b.theme) || a.titre.localeCompare(b.titre)),
    [fiches, type]
  );
}

export function useBilansConseilClasse(classeId: string | null): BilanConseilClasse[] {
  const { bilansConseilClasse } = useStoreState();
  return useMemo(
    () =>
      classeId
        ? bilansConseilClasse
            .filter((b) => b.classeId === classeId)
            .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
        : [],
    [bilansConseilClasse, classeId]
  );
}

export function useRevisionPlan(progressionItemId: string | null): RevisionPlanItem[] {
  const { revisionPlans } = useStoreState();
  return useMemo(
    () =>
      revisionPlans
        .filter((r) => r.progressionItemId === progressionItemId)
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO)),
    [revisionPlans, progressionItemId]
  );
}

export function useCompetences(evaluationId: string | null): Competence[] {
  const { competences } = useStoreState();
  return useMemo(
    () =>
      evaluationId
        ? competences
            .filter((c) => c.evaluationId === evaluationId)
            .sort((a, b) => a.ordre - b.ordre)
        : [],
    [competences, evaluationId]
  );
}

export function useEvaluationCompetences(evaluationId: string | null): EvaluationCompetence[] {
  const { evaluationCompetences, competences } = useStoreState();
  return useMemo(() => {
    if (!evaluationId) return [];
    const competenceIds = new Set(
      competences.filter((c) => c.evaluationId === evaluationId).map((c) => c.id)
    );
    return evaluationCompetences.filter((ec) => competenceIds.has(ec.competenceId));
  }, [evaluationCompetences, competences, evaluationId]);
}

export function useEvaluationCompetence(
  competenceId: string | null,
  eleveId: string | null
): EvaluationCompetence | null {
  const { evaluationCompetences } = useStoreState();
  return useMemo(
    () =>
      evaluationCompetences.find(
        (ec) => ec.competenceId === competenceId && ec.eleveId === eleveId
      ) ?? null,
    [evaluationCompetences, competenceId, eleveId]
  );
}
