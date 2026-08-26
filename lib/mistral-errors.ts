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
    if (error.statusCode === 401 || error.statusCode === 403) {
      return "Clé API Mistral invalide ou non autorisée.";
    }
    if (error.statusCode === 429) {
      return "Limite de requêtes atteinte. Réessayez dans quelques instants.";
    }
    return `Erreur API Mistral (${error.statusCode}) : ${error.message}`;
  }

  return "Erreur inattendue lors de l'appel à l'IA.";
}
