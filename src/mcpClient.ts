import fetch from 'node-fetch';

const MCP_SERVER = 'http://localhost:8001';

// Rolling buffer for last 4 prompt-response pairs
const lastPairs: { query: string; response: string }[] = [];

/**
 * Call the unified /memory_recall_and_store endpoint.
 * If response is null, performs recall. If response is provided, logs the pair (with deduplication).
 * Always sends the last 4 pairs for deduplication.
 * Accepts extra fields for compliance/gamification.
 */
export async function memoryRecallAndStore({ query, response = null, k = 5, ...rest }: { query: string, response?: string | null, k?: number, [key: string]: any }) {
  const payload: any = { query, k, last_pairs: lastPairs.slice(-4), ...rest };
  if (response !== null) payload.response = response;
  const res = await fetch(`${MCP_SERVER}/memory_recall_and_store`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

/**
 * Update the rolling buffer with a new prompt-response pair.
 * Call this after logging a new pair.
 */
export function updateLastPairs(query: string, response: string) {
  lastPairs.push({ query, response });
  if (lastPairs.length > 4) lastPairs.splice(0, lastPairs.length - 4);
}

// Deprecated: use memoryRecallAndStore instead
export async function addMemory(prompt: string, response: string) {
  return memoryRecallAndStore({ query: prompt, response });
}

export async function searchMemory(query: string, n_results = 5) {
  return memoryRecallAndStore({ query, k: n_results });
}

export async function recallMemory(id: string) {
  // Not supported in unified endpoint; implement if needed
  throw new Error('recallMemory by ID is not supported in the unified endpoint.');
}

export async function listTools() {
  const res = await fetch(`${MCP_SERVER}/tools`);
  return res.json();
} 