import * as errors from "@mistralai/mistralai/models/errors";

/**
 * Message d'erreur explicite selon le finishReason renvoyé par Mistral, ou
 * `null` si la génération s'est terminée normalement.
 */
export function describeFinishReasonError(
  finishReason: string | undefined
): string | null {
  if (finishReason === "length" || finishReason === "model_length") {
    return "La réponse du modèle a été tronquée (limite de tokens atteinte). Réessayez avec une demande plus courte.";
  }
  if (finishReason === "error") {
    return "Le modèle a rencontré une erreur pendant la génération de la réponse.";
  }
  return null;
}

function extractApiMessage(body: string): string | null {
  try {
    const message = JSON.parse(body)?.message;
    return typeof message === "string" ? message : null;
  } catch {
    return null;
  }
}

/** Journalise le refus API côté serveur (jamais la requête ni les prompts) pour le diagnostic. */
function logMistralError(error: errors.MistralError): void {
  let details: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(error.body);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      details = parsed as Record<string, unknown>;
    }
  } catch {
    // Corps non JSON : rien de plus à journaliser.
  }
  const safeDetail = (value: unknown) => {
    if (typeof value !== "string" && typeof value !== "number") return undefined;
    const text = String(value);
    const key = process.env.MISTRAL_API_KEY;
    return (key ? text.split(key).join("[masqué]") : text).slice(0, 500);
  };
  const rateLimits: Record<string, string> = {};
  error.headers.forEach((value, name) => {
    if (/^(?:x-ratelimit-[a-z-]+|retry-after)$/.test(name) && /^[\d\s.,;=:/+-]+$/.test(value)) {
      rateLimits[name] = value.slice(0, 150);
    }
  });
  console.error("[Mistral API]", JSON.stringify({
    status: error.statusCode,
    code: safeDetail(details.code),
    type: safeDetail(details.type),
    message: safeDetail(details.message),
    rateLimits,
  }));
}

/** Traduit une exception levée par le SDK Mistral en message explicite pour le prof. */
export function describeMistralError(error: unknown): string {
  if (
    error instanceof errors.ConnectionError ||
    error instanceof errors.RequestTimeoutError ||
    error instanceof errors.RequestAbortedError
  ) {
    return "Impossible de contacter l'API Mistral. Vérifiez la connexion réseau.";
  }

  if (error instanceof errors.MistralError) {
    logMistralError(error);
    const detail = extractApiMessage(error.body);
    const suffix = detail ? ` (${detail})` : "";
    if (error.statusCode === 401) {
      return `Clé API Mistral invalide${suffix}.`;
    }
    if (error.statusCode === 403) {
      return `Accès refusé par Mistral${suffix}.`;
    }
    if (error.statusCode === 429) {
      return `Limite Mistral atteinte${suffix}. Réessayez dans quelques instants.`;
    }
    return `Erreur API Mistral (${error.statusCode}) : ${error.message}`;
  }

  return "Erreur inattendue lors de l'appel à l'IA.";
}
