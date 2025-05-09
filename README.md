# OmniThreads Extension

## Overview
OmniThreads Extension brings vector memory and compliance to any IDE agent in VS Code, using a local, private Python backend (FastAPI + ChromaDB). It is designed for privacy, seamless UX, and plug-and-play operation—no project folder clutter, no cloud storage.

## Features
- Vector memory for any IDE agent
- Time-decayed recall (recent memories are more relevant)
- Centralized, hidden storage (`~/.omnivector_workspaces`)
- Status bar: 🟡 Cached, 🟢 Active, 🔴 Failed
- In-memory/temp cache for unsaved workspaces
- Robust error handling and fallback
- Natural language triggers for full history search
- Local-only data (privacy-first)

## Installation
### 1. Extension
- Download or build the `.vsix` package (see below for building from source)
- In VS Code, open the Command Palette and select `Extensions: Install from VSIX...`
- Select your `.vsix` file

### 2. Backend (Python)
- Ensure Python 3.8+
- Install dependencies:
  ```sh
  pip install -r requirements.txt
  ```
- The extension will auto-start the backend as needed

## MCP Server (Local MVP) Setup

1. **Install Node.js** (v18+ recommended)
2. In the project root, run:
   ```sh
   npm install
   ```
   This will install all dependencies for the MCP server (see `package.json`).
3. **Start the MCP server:**
   ```sh
   node mcp_server.js
   ```
   The server will run on `http://localhost:8001` by default.

- The MCP server is local-only for MVP. No Python dependencies are required unless you add a Python microservice later.
- For Python microservices, use `requirements.txt` and run `pip install -r requirements.txt` as needed.

## Quickstart for New Users
1. Install the extension and backend as described below.
2. Open a workspace in VS Code.
3. Use the Command Palette to add, search, or recall memory (try 'OmniThreads: Add Memory').
4. The status bar shows current memory state (hover for details).
5. If you see an error, check that the MCP server is running (see below).

## Usage
- The extension manages all memory and compliance data automatically
- No files are added to your project folders
- Status bar shows current state
- All data is stored in `~/.omnivector_workspaces/<workspace_id>`
- For unsaved workspaces, data is cached in memory/temp files
- On save, cache is moved to central storage

## Privacy
- All data is stored locally
- No data is sent to the cloud unless you opt in to error reporting
- You can delete your vector memory by removing the relevant folder in `~/.omnivector_workspaces`

## Error Handling & Tooltips
- The extension provides clear, actionable error messages if the MCP server is not running or a request fails.
- Status bar icons have tooltips for quick reference.
- If required input is missing, you'll see a warning message.
- If no relevant memories are found, you'll be informed.

## Troubleshooting
- If the status bar shows 🔴 Failed, check that Python and dependencies are installed
- Ensure no other process is using the backend port (default: 8000)
- Check logs in `~/.omnivector_workspaces/<workspace>/semantic/vector_status.log`
- Restart VS Code if the backend fails to start

## Building from Source
- Clone the repo
- Run `npm install` in the extension root
- Run `vsce package` to build the `.vsix` file
- Install Python dependencies as above

## Backend API (for developers)
- `/log` (POST): Log a prompt/response pair
- `/search` (GET): Search memory (supports time decay and full history)
- `/conversations` (GET): List all stored conversations
- `/status` (GET): Get backend status

## MCP API: Unified Memory Recall and Store Endpoint

### Endpoint
POST http://localhost:8001/mcp/memory_recall_and_store

### Parameters (JSON body)
- `query` (string): The prompt or query to recall/store.
- `response` (string, optional): The response to log (if logging a new memory).
- `last_pairs` (array, optional): Recent prompt/response pairs for deduplication.
- `compliance_score` (number, optional): Compliance score for this memory.
- `compliance_fields` (object, optional): Additional compliance metadata.

### Example: Add and Recall
```json
{
  "query": "What is the capital of France?",
  "response": "Paris",
  "last_pairs": [],
  "compliance_score": 1,
  "compliance_fields": { "source": "test" }
}
```

### Example: Recall with Deduplication
```json
{
  "query": "What is the capital of France?",
  "last_pairs": [
    { "prompt": "What is the capital of France?", "response": "Paris" }
  ]
}
```

### Example Response
```json
{
  "recalled": [
    {
      "id": "...",
      "prompt": "What is the capital of France?",
      "response": "Paris",
      "embedding": [ ... ],
      "timestamp": 1746736452859,
      "compliance_score": 1,
      "compliance_fields": { "source": "test" },
      "score": 10
    }
  ],
  "logged": {
    "id": "...",
    "prompt": "What is the capital of France?",
    "response": "Paris",
    "embedding": [ ... ],
    "timestamp": 1746736452859,
    "compliance_score": 1,
    "compliance_fields": { "source": "test" }
  }
}
```

- Use this endpoint for both memory recall and logging in Cursor or any agent integration.
- Deduplication and time decay are handled automatically.

## Contributing
- PRs and feedback welcome! See the build plan for roadmap and open tasks.

## Release Process

1. Update `package.json` version and `CHANGELOG.md`.
2. Commit changes:
   `git commit -am "chore(release): vX.Y.Z"`
3. Tag the release:
   `git tag vX.Y.Z && git push --tags`
4. Build the extension:
   `vsce package`
5. (Optional) Create a GitHub Release and upload the `.vsix` file.
6. (Optional) Publish to the VS Code Marketplace:
   `vsce publish`

---
For more, see the build plan and in-code documentation. ECHO is on.
"# Trigger CI"  

## RAGAS Analytics & Privacy

This extension/framework includes an optional RAGAS analytics module for evaluating retrieval performance (speed, accuracy, drift, decay effect, etc.).

- **By default, no user content, code, or personal information is ever logged.**
- Only anonymized, aggregated metrics are collected (e.g., speed, accuracy, drift scores).
- Session and workspace IDs are hashed locally with a random salt and are not reversible.
- MongoDB logging is **disabled by default** for local testing and debugging.

### Enabling RAGAS Analytics Logging

To enable logging of anonymized RAGAS metrics to a MongoDB database, set the following environment variable:

```
RAGAS_MONGO_ENABLED=true
```

You can also set the MongoDB connection string (optional):

```
RAGAS_MONGO_URL=mongodb://localhost:27017
```

### Privacy Note for Beta Testers

- No raw prompts, responses, code, or personal data are ever logged or transmitted.
- Only anonymized, aggregated performance metrics are collected for research and quality improvement.
- You may opt out of analytics by leaving RAGAS_MONGO_ENABLED unset or set to `false` (the default).

For questions or concerns about privacy, please contact the project maintainers.
