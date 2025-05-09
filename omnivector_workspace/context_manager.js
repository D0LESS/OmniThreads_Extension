const fs = require('fs');
const path = require('path');
const axios = require('axios');

const CONTEXT_FILENAME = '.omnithreads_project_context.md';
const GITIGNORE_ENTRY = '.omnithreads_project_context.*';

const CONTEXT_TEMPLATE = `# Project Context

**Project Name:** [Your Project Name]
**Created:** ${new Date().toISOString().slice(0, 10)}

## Project Description
[Describe the purpose, goals, and scope of this project.]

## Key Features / Architecture
- [Feature 1]
- [Feature 2]

## Important Decisions / Notes
- [Decision 1]
- [Decision 2]
`;

function ensureContextFile(workspaceRoot) {
  const contextPath = path.join(workspaceRoot, CONTEXT_FILENAME);
  if (!fs.existsSync(contextPath)) {
    fs.writeFileSync(contextPath, CONTEXT_TEMPLATE, 'utf8');
  }
  ensureGitignore(workspaceRoot);
}

function ensureGitignore(workspaceRoot) {
  const gitignorePath = path.join(workspaceRoot, '.gitignore');
  let lines = [];
  if (fs.existsSync(gitignorePath)) {
    lines = fs.readFileSync(gitignorePath, 'utf8').split(/\r?\n/);
  }
  if (!lines.includes(GITIGNORE_ENTRY)) {
    lines.push(GITIGNORE_ENTRY);
    fs.writeFileSync(gitignorePath, lines.join('\n'), 'utf8');
  }
}

function watchContextFile(workspaceRoot, mcpUrl = 'http://localhost:8001') {
  const contextPath = path.join(workspaceRoot, CONTEXT_FILENAME);
  if (!fs.existsSync(contextPath)) return;
  fs.watch(contextPath, { persistent: true }, (eventType) => {
    if (eventType === 'change') {
      // Debounce to avoid multiple triggers
      setTimeout(() => {
        const context = fs.readFileSync(contextPath, 'utf8');
        axios.post(`${mcpUrl}/mcp/update_project_context`, { context })
          .then(() => console.log('Project context updated in MCP server.'))
          .catch(err => console.error('Failed to update project context:', err.message));
      }, 200);
    }
  });
}

module.exports = {
  ensureContextFile,
  watchContextFile
}; 