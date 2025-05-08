// start_all.js
// Usage: node start_all.js [workspace]
// Starts the FastAPI backend and MCP server with the given workspace name (default: 'default')

const { spawn } = require('child_process');
const path = require('path');
const projectRoot = __dirname; // Project root for PYTHONPATH

const workspace = process.argv[2] || 'default';

console.log(`Starting FastAPI backend for workspace: ${workspace}`);
const python = spawn('python', [
  '-m',
  'OmniThreadsExtension.backend.server.session_bootstrapper',
  '--workspace',
  workspace
], {
  stdio: 'inherit',
  env: { ...process.env, PYTHONPATH: projectRoot }
});

python.on('error', (err) => {
  console.error('Failed to start FastAPI backend:', err);
});

// Wait for FastAPI to start (could be improved with health check)
setTimeout(() => {
  console.log(`Starting MCP server for workspace: ${workspace}`);
  const node = spawn('node', ['mcp_server.js', workspace], { stdio: 'inherit' });
  node.on('error', (err) => {
    console.error('Failed to start MCP server:', err);
  });
  node.on('exit', (code) => {
    console.log(`MCP server exited with code ${code}`);
    python.kill();
  });
  process.on('SIGINT', () => {
    node.kill();
    python.kill();
    process.exit();
  });
}, 3000); // Wait 3 seconds for FastAPI to start 