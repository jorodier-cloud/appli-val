export interface NoteEleve {
  nom: string;
  note: number | null;
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
