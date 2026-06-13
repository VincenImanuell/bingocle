import fs from "node:fs";
import path from "node:path";

/**
 * Speech-to-text for the Validation Oracle. Transcribes an audio file so the
 * oracle can match spoken words and commit verdicts on-chain.
 *
 * Two backends, picked automatically:
 *   - OPENAI_API_KEY set  -> OpenAI Whisper (whisper-1)
 *   - else GEMINI_API_KEY -> Google Gemini (multimodal audio, no extra key/billing)
 * The recorded-transcript demo path (`npm run oracle` with text) needs neither.
 */
export async function transcribeAudio(filePath: string, opts?: { model?: string }): Promise<string> {
  if (!fs.existsSync(filePath)) throw new Error(`audio file not found: ${filePath}`);
  if (process.env.OPENAI_API_KEY) return transcribeWhisper(filePath, opts);
  if (process.env.GEMINI_API_KEY) return transcribeGemini(filePath, opts);
  throw new Error("Set OPENAI_API_KEY or GEMINI_API_KEY for speech-to-text (or use the transcript demo path).");
}

function mimeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".mp3": return "audio/mp3";
    case ".wav": return "audio/wav";
    case ".m4a":
    case ".mp4": return "audio/mp4";
    case ".aac": return "audio/aac";
    case ".ogg": return "audio/ogg";
    case ".flac": return "audio/flac";
    default: return "audio/mpeg";
  }
}

/** Google Gemini multimodal transcription (reuses GEMINI_API_KEY). */
async function transcribeGemini(filePath: string, opts?: { model?: string }): Promise<string> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string).getGenerativeModel({
    model: opts?.model ?? process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  });
  const data = fs.readFileSync(filePath).toString("base64");
  const result = await model.generateContent([
    { inlineData: { mimeType: mimeFor(filePath), data } },
    { text: "Transcribe this audio to plain text, verbatim. Return only the transcript, no commentary." },
  ]);
  return result.response.text().trim();
}

/** OpenAI Whisper transcription (no SDK — raw multipart fetch). */
async function transcribeWhisper(filePath: string, opts?: { model?: string }): Promise<string> {
  const key = process.env.OPENAI_API_KEY as string;
  const bytes = fs.readFileSync(filePath);
  const form = new FormData();
  form.append("file", new Blob([bytes]), path.basename(filePath));
  form.append("model", opts?.model ?? "whisper-1");
  form.append("response_format", "text");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Whisper STT failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return (await res.text()).trim();
}
