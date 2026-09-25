import { Mistral } from "@mistralai/mistralai";
import * as errors from "@mistralai/mistralai/models/errors";
import { z, type ZodType } from "zod";
import { describeFinishReasonError, describeMistralError } from "@/lib/mistral-errors";

// Ordre choisi selon les limites du plan gratuit (admin.mistral.ai/plateforme/limits) :
// medium n'y a que 20k tokens/min, large 250k, les ministral bien plus.
// Bascule sur 429 (limite) et 401/403 (modèle non autorisé pour ce compte).
const MODELS = [
  "mistral-large-2512",
  "ministral-14b-2512",
  "ministral-8b-2512",
  "mistral-medium-latest",
] as const;
const FALLBACK_STATUSES = new Set([401, 403, 429]);

type ChatRequest = Omit<Parameters<Mistral["chat"]["complete"]>[0], "model">;

async function completeWithFallback(client: Mistral, request: ChatRequest) {
  let lastError: unknown;
  for (const model of MODELS) {
    try {
      return await client.chat.complete({ ...request, model });
    } catch (error) {
      if (!(error instanceof errors.MistralError) || !FALLBACK_STATUSES.has(error.statusCode)) {
        throw error;
      }
      lastError = error;
    }
  }
  throw lastError;
}

export type MistralCallResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type UserContent =
  | string
  | Array<{ type: "text"; text: string } | { type: "image_url"; imageUrl: string }>;

interface MistralStructuredCallInput<T> {
  systemPrompt: string;
  userContent: UserContent;
  schema: ZodType<T>;
  schemaName: string;
  maxTokens?: number;
}

/**
 * Appel Mistral avec sortie structurée (Structured Outputs, JSON Schema strict),
 * factorisé pour les Server Actions de génération IA de ce projet : vérification
 * de la clé, appel du serveur EU (RGPD), parsing + validation Zod, et mapping
 * d'erreurs, tous partagés (voir lib/mistral-errors.ts).
 */
export async function callMistralStructured<T>({
  systemPrompt,
  userContent,
  schema,
  schemaName,
  maxTokens = 4000,
}: MistralStructuredCallInput<T>): Promise<MistralCallResult<T>> {
  if (!process.env.MISTRAL_API_KEY) {
    return {
      ok: false,
      error: "Clé API Mistral manquante. Définissez MISTRAL_API_KEY dans .env.local.",
    };
  }

  // Serveur EU (api.eu.mistral.ai) : traitement des données dans l'UE, exigence RGPD.
  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY, server: "eu" });
  const jsonSchema = z.toJSONSchema(schema);

  try {
    const response = await completeWithFallback(client, {
      maxTokens,
      responseFormat: {
        type: "json_schema",
        jsonSchema: { name: schemaName, schemaDefinition: jsonSchema, strict: true },
      },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    const choice = response.choices?.[0];

    const finishReasonError = describeFinishReasonError(choice?.finishReason);
    if (finishReasonError) return { ok: false, error: finishReasonError };

    const content = choice?.message?.content;
    if (typeof content !== "string") {
      return { ok: false, error: "Impossible d'interpréter la réponse du modèle." };
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
    } catch {
      return { ok: false, error: "La réponse du modèle n'est pas un JSON valide." };
    }

    const parsed = schema.safeParse(parsedJson);
    if (!parsed.success) {
      return { ok: false, error: "La réponse du modèle ne correspond pas au schéma attendu." };
    }

    return { ok: true, data: parsed.data };
  } catch (error) {
    return { ok: false, error: describeMistralError(error) };
  }
}

interface MistralTextCallInput {
  systemPrompt: string;
  userContent: UserContent;
  maxTokens?: number;
}

/**
 * Appel Mistral en texte libre (markdown), pour les contenus pédagogiques
 * (synthèse, fiche, évaluation, Rapidos, corrigé) qui n'ont pas besoin d'un
 * schéma JSON structuré — juste un document prêt à afficher.
 */
export async function callMistralText({
  systemPrompt,
  userContent,
  maxTokens = 3000,
}: MistralTextCallInput): Promise<MistralCallResult<string>> {
  if (!process.env.MISTRAL_API_KEY) {
    return {
      ok: false,
      error: "Clé API Mistral manquante. Définissez MISTRAL_API_KEY dans .env.local.",
    };
  }

  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY, server: "eu" });

  try {
    const response = await completeWithFallback(client, {
      maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    const choice = response.choices?.[0];

    const finishReasonError = describeFinishReasonError(choice?.finishReason);
    if (finishReasonError) return { ok: false, error: finishReasonError };

    const content = choice?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return { ok: false, error: "Impossible d'interpréter la réponse du modèle." };
    }

    return { ok: true, data: content.trim() };
  } catch (error) {
    return { ok: false, error: describeMistralError(error) };
  }
}
