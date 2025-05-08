const axios = require('axios');

async function test() {
  // Add memory
  const addRes = await axios.post('http://localhost:8001/mcp/add_memory', {
    prompt: 'What is the capital of France?',
    response: 'Paris'
  });
  console.log('Add Memory:', addRes.data);

  // Search memory
  const searchRes = await axios.post('http://localhost:8001/mcp/search_memory', {
    query: 'capital of France',
    n_results: 5
  });
  console.log('Search Memory:', searchRes.data);

  // Recall memory by ID (use the first result from search)
  if (searchRes.data.length > 0) {
    const recallRes = await axios.post('http://localhost:8001/mcp/recall_memory', {
      id: searchRes.data[0].id
    });
    console.log('Recall Memory:', recallRes.data);
  }
}

test().catch(console.error);