export type TypeFiche = "gestion-classe" | "methodologie";

export interface Fiche {
  id: string;
  type: TypeFiche;
  titre: string;
  theme: string;
  contenu: string;
  updatedAtISO: string;
}
