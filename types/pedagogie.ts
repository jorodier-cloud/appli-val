export interface Niveau {
  id: string;
  nom: string;
}

export interface ProgressionItem {
  id: string;
  niveauId: string;
  ordre: number;
  titre: string;
  periode: string;
  traite: boolean;
}
