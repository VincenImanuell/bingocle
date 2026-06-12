import fs from "node:fs";
import path from "node:path";

/**
 * Speech-to-text for the Validation Oracle. Transcribes an audio file via the
 * OpenAI Whisper API (no SDK dependency — raw multipart fetch). Set
 * OPENAI_API_KEY to enable; the recorded-transcript demo path works without it.
 */
export async function transcribeAudio(filePath: string, opts?: { model?: string }): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set (or use the transcript demo path).");
  if (!fs.existsSync(filePath)) throw new Error(`audio file not found: ${filePath}`);

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
