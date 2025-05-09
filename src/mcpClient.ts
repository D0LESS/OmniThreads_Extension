import fetch from 'node-fetch';

const MCP_SERVER = 'http://localhost:8001/mcp';

export interface MemoryPair {
  prompt: string;
  response: string;
}

export interface ComplianceFields {
  [key: string]: any;
}

export async function memoryRecallAndStore({
  query,
  response = undefined,
  last_pairs = [],
  compliance_score = null,
  compliance_fields = {}
}: {
  query: string;
  response?: string;
  last_pairs?: MemoryPair[];
  compliance_score?: number | null;
  compliance_fields?: ComplianceFields;
}) {
  const res = await fetch(`${MCP_SERVER}/memory_recall_and_store`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, response, last_pairs, compliance_score, compliance_fields })
  });
  return res.json();
}

export async function listTools() {
  const res = await fetch(`${MCP_SERVER}/tools`);
  return res.json();
} 