import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { WordOdds } from "./ai/odds.js";
import type { Decision } from "./ai/curator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "..", ".data");
const FILE = path.join(DATA_DIR, "events.json");

export type EventRecord = {
  eventId: number;
  theme: string;
  description: string;
  words: string[]; // canonical words, index == on-chain wordIndex
  founders: string[]; // parallel to words ("" if AI-suggested)
  odds: WordOdds[];
  decisions?: Decision[];
  merkleRoot?: string;
  committedTx?: string;
};

type DB = { events: Record<string, EventRecord> };

function load(): DB {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return { events: {} };
  }
}

function save(db: DB): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

export function putEvent(rec: EventRecord): void {
  const db = load();
  db.events[String(rec.eventId)] = rec;
  save(db);
}

export function getEvent(eventId: number): EventRecord | undefined {
  return load().events[String(eventId)];
}

export function listEvents(): EventRecord[] {
  return Object.values(load().events);
}
