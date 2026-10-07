// Code d'accès de l'application : protège les pages et les Server Actions
// (qui consomment le crédit Mistral). Actif seulement si ACCESS_CODE est défini.

export const COOKIE_ACCES = "riwaq_acces";

// Jeton stocké dans le cookie : empreinte du code, jamais le code lui-même.
export async function jetonAcces(code: string): Promise<string> {
  const octets = new TextEncoder().encode(`riwaq-acces:v1:${code}`);
  const empreinte = await crypto.subtle.digest("SHA-256", octets);
  return Array.from(new Uint8Array(empreinte), (o) => o.toString(16).padStart(2, "0")).join("");
}

// Comparaison à temps constant de deux chaînes de même nature.
export function egalConstant(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
