export interface Niveau {
  id: string;
  nom: string;
}

export interface ProgressionItem {
  id: string;
  niveauId: string;
  ordre: number;
  titre: string;
  dateISO: string;
}

export interface QuestionFlash {
  id: string;
  niveauId: string;
  progressionItemId: string;
  enonce: string;
  reponse: string;
  createdAtISO: string;
}

export interface TestReactivation {
  id: string;
  niveauId: string;
  seance: number;
  questionIds: string[];
  createdAtISO: string;
}
