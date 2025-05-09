const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');

const app = express();
app.use(bodyParser.json());

const conversationStore = [];
const codeStore = [];
const RAGAS_JOB_FILE = 'ragas_jobs.json';
const SALT_FILE = 'ragas_salt.txt';
let logCounter = 0;
let salt = '';
try {
  salt = fs.readFileSync(SALT_FILE, 'utf8');
} catch {
  salt = crypto.randomBytes(16).toString('hex');
  fs.writeFileSync(SALT_FILE, salt);
}
const mongoUrl = process.env.RAGAS_MONGO_URL || 'mongodb://localhost:27017';
const mongoClient = new MongoClient(mongoUrl);
const RAGAS_MONGO_ENABLED = process.env.RAGAS_MONGO_ENABLED === 'true';
let mongoDb = null;
if (RAGAS_MONGO_ENABLED) {
  mongoClient.connect().then(client => { mongoDb = client.db('ragas'); });
}

// Dummy embed function (replace with real embeddings later)
function embed(text) {
  return text.split('').map(c => c.charCodeAt(0)).slice(0, 10);
}

// List available MCP tools
app.get('/mcp/tools', (req, res) => {
  res.json([
    {
      name: 'add_memory',
      description: 'Store a prompt/response pair in vector memory.',
      parameters: { prompt: 'string', response: 'string' }
    },
    {
      name: 'search_memory',
      description: 'Search vector memory for relevant information.',
      parameters: { query: 'string', n_results: 'int' }
    },
    {
      name: 'recall_memory',
      description: 'Recall a specific memory by ID.',
      parameters: { id: 'string' }
    }
  ]);
});

// Add memory
app.post('/mcp/add_memory', (req, res) => {
  const { prompt, response } = req.body;
  const entry = {
    id: uuidv4(),
    prompt,
    response,
    embedding: embed(prompt + response),
    timestamp: Date.now()
  };
  conversationStore.push(entry);
  console.log('Added memory:', entry);
  res.json({ status: 'ok', id: entry.id });
});

// Search memory
app.post('/mcp/search_memory', (req, res) => {
  const { query, n_results = 5 } = req.body;
  const queryEmb = embed(query);
  // Dummy similarity: count matching elements
  function sim(e) {
    return e.embedding.reduce((acc, val, i) => acc + (val === queryEmb[i] ? 1 : 0), 0);
  }
  const results = conversationStore
    .map(e => ({ ...e, score: sim(e) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n_results);
  res.json(results);
});

// Recall memory by ID
app.post('/mcp/recall_memory', (req, res) => {
  const { id } = req.body;
  const entry = conversationStore.find(e => e.id === id);
  if (entry) {
    res.json(entry);
  } else {
    res.status(404).json({ error: 'not found' });
  }
});

// Helper: Calculate time decay factor
function timeDecay(timestamp) {
  const now = Date.now();
  const days = (now - timestamp) / (1000 * 60 * 60 * 24);
  if (days <= 15) return 1.0;
  const lambda = 0.0614; // Decays from 1.0 at day 15 to 0.01 at day 90
  return Math.exp(-lambda * (days - 15));
}

function appendRagasJob(job) {
  fs.readFile(RAGAS_JOB_FILE, (err, data) => {
    let jobs = [];
    if (!err && data) {
      try { jobs = JSON.parse(data); } catch {}
    }
    jobs.push(job);
    fs.writeFile(RAGAS_JOB_FILE, JSON.stringify(jobs, null, 2), () => {});
  });
}

function hashId(id) {
  return crypto.createHash('sha256').update(id + salt).digest('hex');
}

async function logRagasMetrics({ sessionId, workspaceId, metrics, type, tool_version }) {
  if (!RAGAS_MONGO_ENABLED || !mongoDb) return;
  await mongoDb.collection('ragas_metrics').insertOne({
    timestamp: Date.now(),
    session_id_hash: sessionId ? hashId(sessionId) : undefined,
    workspace_id_hash: workspaceId ? hashId(workspaceId) : undefined,
    metrics,
    type,
    meta: { tool_version }
  });
}

// Project context decay: 1.0 for 1 month, decays to 0.5 at 6 months, never below 0.5
function projectContextDecay(timestamp) {
  const now = Date.now();
  const months = (now - timestamp) / (1000 * 60 * 60 * 24 * 30.44);
  if (months <= 1) return 1.0;
  if (months >= 6) return 0.5;
  const lambda = 0.1386;
  return Math.max(0.5, Math.exp(-lambda * (months - 1)));
}

// Store project context as a single entry per workspace
let projectContextEntry = null;

// Endpoint to update project context (could be called by agent/extension)
app.post('/mcp/update_project_context', (req, res) => {
  const { context, meta = {} } = req.body;
  projectContextEntry = {
    id: 'project_context',
    type: 'project_context',
    context,
    timestamp: Date.now(),
    ...meta
  };
  res.json({ status: 'ok', project_context: projectContextEntry });
});

// Unified endpoint for recall and store with compliance
app.post('/mcp/memory_recall_and_store', (req, res) => {
  const { query, response, last_pairs = [], compliance_score = null, compliance_fields = {}, type = 'conversation', ...meta } = req.body;
  let newEntry = null;
  if (query && response) {
    newEntry = {
      id: uuidv4(),
      type,
      prompt: query,
      response,
      embedding: embed(query + response),
      timestamp: Date.now(),
      compliance_score: compliance_score || 0,
      compliance_fields: compliance_fields || {},
      ...meta
    };
    if (type === 'code') {
      // Expect file_path, function_name, purpose, language in meta
      codeStore.push(newEntry);
    } else {
      conversationStore.push(newEntry);
    }
    logCounter++;
    if (logCounter % 25 === 0) {
      // Get last 25 entries for RAGAS job (from both stores)
      const last25 = [
        ...conversationStore.slice(-25),
        ...codeStore.slice(-25)
      ];
      appendRagasJob({ timestamp: Date.now(), entries: last25 });
    }
    console.log('Logged memory with compliance:', newEntry);
  }
  // Recall relevant memories (with time decay only)
  const queryEmb = embed(query || '');
  function sim(e) {
    return e.embedding.reduce((acc, val, i) => acc + (val === queryEmb[i] ? 1 : 0), 0);
  }
  let results = [];
  if (req.body.type === 'code') {
    results = codeStore
      .map(e => ({ ...e, score: sim(e) * timeDecay(e.timestamp) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  } else if (req.body.type === 'conversation') {
    results = conversationStore
      .map(e => ({ ...e, score: sim(e) * timeDecay(e.timestamp) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  } else {
    // Hybrid: search both stores, merge, and sort
    results = [
      ...conversationStore.map(e => ({ ...e, score: sim(e) * timeDecay(e.timestamp) })),
      ...codeStore.map(e => ({ ...e, score: sim(e) * timeDecay(e.timestamp) }))
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }
  // Always include project context if present
  if (projectContextEntry) {
    const contextScore = projectContextDecay(projectContextEntry.timestamp);
    results.unshift({ ...projectContextEntry, score: contextScore });
    // Optionally, sort again if you want project context to be ranked by score
    results = results.sort((a, b) => b.score - a.score).slice(0, 5);
  }
  res.json({ recalled: results, logged: newEntry });
});

const PORT = 8001;
app.listen(PORT, () => {
  console.log(`MCP server running on http://localhost:${PORT}`);
}); 