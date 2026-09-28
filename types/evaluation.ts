export interface QuestionScore {
  question: string;
  pointsAwarded: number;
  pointsPossible: number;
  feedback: string;
}

export interface NoteEleve {
  nom: string;
  note: number | null;
  breakdown?: QuestionScore[];
  appreciation?: string;
}

export interface EvaluationSuivi {
  id: string;
  niveauId: string;
  titre: string;
  dateEvalISO: string;
  sujet: string;
  eleves: NoteEleve[];
  notionsRatees: string;
  corrigeRessourceId: string | null;
  restituee: boolean;
  dateRestitutionISO: string | null;
}
