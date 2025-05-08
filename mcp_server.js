const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());

const vectorStore = [];

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
  vectorStore.push(entry);
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
  const results = vectorStore
    .map(e => ({ ...e, score: sim(e) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n_results);
  res.json(results);
});

// Recall memory by ID
app.post('/mcp/recall_memory', (req, res) => {
  const { id } = req.body;
  const entry = vectorStore.find(e => e.id === id);
  if (entry) {
    res.json(entry);
  } else {
    res.status(404).json({ error: 'not found' });
  }
});

const PORT = 8001;
app.listen(PORT, () => {
  console.log(`MCP server running on http://localhost:${PORT}`);
}); 