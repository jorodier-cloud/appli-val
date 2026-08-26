export type TypeBlocCours =
  | "definition"
  | "propriete"
  | "theoreme"
  | "remarque"
  | "exemple";

export interface BlocCours {
  type: TypeBlocCours;
  titre: string;
  contenu: string;
}

export interface SupportCours {
  id: string;
  progressionItemId: string;
  introduction: string;
  blocs: BlocCours[];
  createdAtISO: string;
}

export type NiveauExercice =
  | "application"
  | "complementaire"
  | "complexe"
  | "demonstration";

export interface Exercice {
  niveau: NiveauExercice;
  enonce: string;
}

export interface FicheExercices {
  id: string;
  progressionItemId: string;
  exercices: Exercice[];
  createdAtISO: string;
}

export interface ExerciceEvalue {
  enonce: string;
  bareme: string;
  corrige: string;
}

export interface EvaluationGeneree {
  id: string;
  progressionItemId: string;
  exercices: ExerciceEvalue[];
  createdAtISO: string;
}
