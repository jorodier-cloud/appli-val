import type { Eleve } from "@/types/domain";

function normalize(value: string): string[] {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((token) => token.length >= 2);
}

/**
 * Rapproche le nom détecté par l'IA (souvent bruité) d'un élève de la classe.
 * Ne renvoie un candidat que s'il est le seul à partager au moins un token de
 * nom avec le nom détecté — sinon on laisse le prof choisir manuellement.
 */
export function matchDetectedName(
  detectedName: string | null | undefined,
  eleves: Eleve[]
): Eleve | null {
  if (!detectedName) return null;
  const detectedTokens = new Set(normalize(detectedName));
  if (detectedTokens.size === 0) return null;

  const candidates = eleves.filter((eleve) => {
    const eleveTokens = normalize(`${eleve.prenom} ${eleve.nom}`);
    return eleveTokens.some((token) => detectedTokens.has(token));
  });

  return candidates.length === 1 ? candidates[0]! : null;
}
