import { config } from "./config.js";

/** Thin client for the Bingocle agent service (the AI + organizer-wallet side). */
async function call(method: string, pathName: string, body?: unknown): Promise<any> {
  const res = await fetch(`${config.agentApiUrl}${pathName}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Agent API ${pathName} -> ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(json.error ?? `Agent API ${pathName} -> ${res.status}`);
  return json;
}

export const agentApi = {
  createEvent: (input: Record<string, unknown>) => call("POST", "/events", input),
  getEvent: (id: number) => call("GET", `/events/${id}`),
  commitPool: (id: number, body: unknown) => call("POST", `/events/${id}/commit-pool`, body),
  validate: (id: number, body: unknown) => call("POST", `/events/${id}/validate`, body),
  card: (id: number, address: string) => call("GET", `/events/${id}/card/${address}`),
};
