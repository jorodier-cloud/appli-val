import { Mistral } from "@mistralai/mistralai";
import { z, type ZodType } from "zod";
import { describeFinishReasonError, describeMistralError } from "@/lib/mistral-errors";

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
    const response = await client.chat.complete({
      model: "mistral-medium-latest",
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
    const response = await client.chat.complete({
      model: "mistral-medium-latest",
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
