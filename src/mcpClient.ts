import fetch from 'node-fetch';

const MCP_SERVER = 'http://localhost:8001/mcp';

export async function addMemory(prompt: string, response: string) {
  const res = await fetch(`${MCP_SERVER}/add_memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, response })
  });
  return res.json();
}

export async function searchMemory(query: string, n_results = 5) {
  const res = await fetch(`${MCP_SERVER}/search_memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, n_results })
  });
  return res.json();
}

export async function recallMemory(id: string) {
  const res = await fetch(`${MCP_SERVER}/recall_memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return res.json();
}

export async function listTools() {
  const res = await fetch(`${MCP_SERVER}/tools`);
  return res.json();
} 