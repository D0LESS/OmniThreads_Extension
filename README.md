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

## Beta Tester Quick Start
1. Install the extension and backend as above
2. Open a workspace in VS Code
3. Interact with your IDE agent as usual
4. Use natural language to search memory (e.g., "look back in our history")
5. Check the status bar for memory state
6. Report any issues or unexpected behavior

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
For more, see the build plan and in-code documentation. "# Trigger CI"  
