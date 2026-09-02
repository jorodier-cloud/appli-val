export type TypeRessource = "synthese" | "fiche" | "evaluation" | "rapidos" | "corrige";

export interface Ressource {
  id: string;
  type: TypeRessource;
  niveauNom: string;
  chapitreTitre: string;
  notes: string;
  contenu: string;
  createdAtISO: string;
}
