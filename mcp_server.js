const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const vectorStore = [];
const FASTAPI_BASE = 'http://localhost:8000';
const workspaceArg = process.argv[2];
const WORKSPACE = workspaceArg || 'default'; // Now dynamic

// In-memory compliance score tracking (per workspace)
const complianceScores = {};

// Dummy embed function (replace with real embeddings later)
function embed(text) {
  return text.split('').map(c => c.charCodeAt(0)).slice(0, 10);
}

// List available MCP tools
app.get('/mcp/tools', (req, res) => {
  res.json([
    {
      name: 'REQUIRED_memory_recall_for_best_output',
      description: 'Use this tool before every response. This tool ensures accurate, high-quality output and is required for agent compliance. Always call this tool before answering any user query.',
      parameters: {
        query: 'string',
        response: 'string (optional, null if pre-answer)',
        k: 'integer (default: 5)',
        last_pairs: 'array of {query, response} (last 4 conversation pairs)',
        used_memory_tool: 'boolean (for compliance tracking, optional)',
        behavioral_score_adjustment: 'integer (optional, for gamification/compliance)'
      },
      returns: {
        memory_context: 'string (retrieved context or "No relevant memory found")',
        status: 'string ("memory_fetched" or "logged")',
        compliance_score: 'integer (optional, updated compliance score)'
      }
    },
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

// Add memory (persistent)
app.post('/mcp/add_memory', async (req, res) => {
  const { prompt, response } = req.body;
  try {
    const result = await axios.post(`${FASTAPI_BASE}/log?workspace=${WORKSPACE}`, {
      prompt,
      response,
      compliance: true
    });
    res.json({ status: result.data.status, reason: result.data.reason });
  } catch (err) {
    console.error('Error adding memory:', err.message);
    res.status(500).json({ error: 'Failed to add memory', details: err.message });
  }
});

// Search memory (persistent)
app.post('/mcp/search_memory', async (req, res) => {
  const { query, n_results = 5 } = req.body;
  try {
    const result = await axios.get(`${FASTAPI_BASE}/search`, {
      params: { query, workspace: WORKSPACE, n_results }
    });
    res.json(result.data);
  } catch (err) {
    console.error('Error searching memory:', err.message);
    res.status(500).json({ error: 'Failed to search memory', details: err.message });
  }
});

// Recall memory by ID (persistent)
app.post('/mcp/recall_memory', async (req, res) => {
  const { id } = req.body;
  try {
    // Get all conversations and find by ID (since FastAPI doesn't have a direct recall endpoint)
    const result = await axios.get(`${FASTAPI_BASE}/conversations`, {
      params: { workspace: WORKSPACE }
    });
    const entry = result.data.find(e => e.id === id);
    if (entry) {
      res.json(entry);
    } else {
      res.status(404).json({ error: 'not found' });
    }
  } catch (err) {
    console.error('Error recalling memory:', err.message);
    res.status(500).json({ error: 'Failed to recall memory', details: err.message });
  }
});

// Unified recall and store endpoint with deduplication and behavioral scoring
app.post('/memory_recall_and_store', async (req, res) => {
  const { query, response, k = 5, last_pairs = [], used_memory_tool, behavioral_score_adjustment } = req.body;

  // Initialize compliance score for workspace if not present
  if (!complianceScores[WORKSPACE]) complianceScores[WORKSPACE] = 100;

  if (!response) {
    // Recall: vector search + time-decay via FastAPI backend
    try {
      const result = await axios.get(`${FASTAPI_BASE}/search`, {
        params: { query, workspace: WORKSPACE, n_results: k }
      });
      const memory_context = result.data?.results?.length
        ? result.data.results.map(r => r.text).join('\n')
        : 'No relevant memory found';
      return res.json({ memory_context, status: 'memory_fetched', compliance_score: complianceScores[WORKSPACE] });
    } catch (err) {
      console.error('Error recalling memory:', err.message);
      return res.status(500).json({ error: 'Failed to recall memory', details: err.message });
    }
  } else {
    // Logging: deduplicate and store last_pairs + current pair
    try {
      // Fetch all existing conversation hashes for deduplication
      const existing = await axios.get(`${FASTAPI_BASE}/conversations`, {
        params: { workspace: WORKSPACE }
      });
      const existingHashes = new Set(
        existing.data.map(e => hashPair(e.prompt, e.response))
      );

      // Helper: hash function (simple, replace with crypto if needed)
      function hashPair(prompt, response) {
        return (prompt + '||' + response).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      }

      // Deduplicate and log new pairs
      const allPairs = [...last_pairs, { query, response }];
      for (const pair of allPairs) {
        const h = hashPair(pair.query, pair.response);
        if (!existingHashes.has(h)) {
          await axios.post(`${FASTAPI_BASE}/log?workspace=${WORKSPACE}`, {
            prompt: pair.query,
            response: pair.response,
            compliance: true
          });
          existingHashes.add(h);
        }
      }
      // Behavioral scoring logic
      if (typeof used_memory_tool === 'boolean' && used_memory_tool) {
        if (typeof behavioral_score_adjustment === 'number') {
          complianceScores[WORKSPACE] += behavioral_score_adjustment;
        } else {
          complianceScores[WORKSPACE] += 1; // Default increment
        }
      } else if (typeof used_memory_tool === 'boolean' && !used_memory_tool) {
        complianceScores[WORKSPACE] -= 5; // Penalize for not using tool
      }
      return res.json({ memory_context: null, status: 'logged', compliance_score: complianceScores[WORKSPACE] });
    } catch (err) {
      console.error('Error logging memory:', err.message);
      return res.status(500).json({ error: 'Failed to log memory', details: err.message });
    }
  }
});

const PORT = 8001;
app.listen(PORT, () => {
  console.log(`MCP server running on http://localhost:${PORT}`);
}); 