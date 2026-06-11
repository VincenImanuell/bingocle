import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { config, requireAnthropic } from "../config.js";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: requireAnthropic() });
  return _client;
}

/**
 * Call Claude with a constrained JSON schema and validate the result with zod.
 * Uses structured outputs (`output_config.format`) + adaptive thinking on
 * claude-opus-4-8. The JSON schema must obey the structured-output subset
 * (no min/max/length constraints); enforce those in the zod schema instead.
 */
export async function structured<T>(args: {
  system: string;
  user: string;
  jsonSchema: Record<string, unknown>;
  zodSchema: z.ZodType<T>;
  maxTokens?: number;
}): Promise<T> {
  const res = await client().messages.create({
    model: config.model,
    max_tokens: args.maxTokens ?? 8000,
    thinking: { type: "adaptive" },
    system: args.system,
    messages: [{ role: "user", content: args.user }],
    output_config: { format: { type: "json_schema", schema: args.jsonSchema } },
  } as any);

  if ((res as any).stop_reason === "refusal") {
    throw new Error("Claude refused the request (stop_reason=refusal).");
  }
  const text = res.content.find((b: any) => b.type === "text") as
    | { type: "text"; text: string }
    | undefined;
  if (!text) throw new Error("No text block in Claude response.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.text);
  } catch {
    throw new Error(`Claude returned non-JSON output: ${text.text.slice(0, 200)}`);
  }
  return args.zodSchema.parse(parsed);
}
