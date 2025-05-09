const axios = require('axios');

async function test() {
  // Add and recall memory using the unified endpoint
  const addRecallRes = await axios.post('http://localhost:8001/mcp/memory_recall_and_store', {
    query: 'What is the capital of France?',
    response: 'Paris',
    last_pairs: [],
    compliance_score: 1,
    compliance_fields: { source: 'test' }
  });
  console.log('Add & Recall (first):', addRecallRes.data);

  // Add a second memory with an old timestamp to test time decay
  // Directly push to vectorStore via a test endpoint or simulate if possible
  // For now, just add a second memory and check recall order
  const addRecallRes2 = await axios.post('http://localhost:8001/mcp/memory_recall_and_store', {
    query: 'What is the capital of Germany?',
    response: 'Berlin',
    last_pairs: [],
    compliance_score: 1,
    compliance_fields: { source: 'test' }
  });
  console.log('Add & Recall (second):', addRecallRes2.data);

  // Recall all memories for a query
  const recallRes = await axios.post('http://localhost:8001/mcp/memory_recall_and_store', {
    query: 'What is the capital of',
    last_pairs: []
  });
  console.log('Recall (all, time decay test):', recallRes.data);
}

test().catch(console.error);