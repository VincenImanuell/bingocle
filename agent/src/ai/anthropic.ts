import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { config, requireGemini } from "../config.js";

let _client: GoogleGenerativeAI | null = null;
function client(): GoogleGenerativeAI {
  if (!_client) _client = new GoogleGenerativeAI(requireGemini());
  return _client;
}

export async function structured<T>(args: {
  system: string;
  user: string;
  jsonSchema: Record<string, unknown>;
  zodSchema: z.ZodType<T>;
  maxTokens?: number;
}): Promise<T> {
  const model = client().getGenerativeModel({
    model: config.model,
    systemInstruction: args.system,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: args.maxTokens ?? 8000,
    } as any,
  });

  const result = await model.generateContent(
    `${args.user}\n\nRespond with valid JSON matching this schema:\n${JSON.stringify(args.jsonSchema, null, 2)}`
  );

  const text = result.response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned non-JSON output: ${text.slice(0, 200)}`);
  }
  return args.zodSchema.parse(parsed);
}
