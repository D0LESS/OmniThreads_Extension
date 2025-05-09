# OmniThreads Extension Build Plan (updated)

## Progress Tracker

- [x] Centralized workspace directory & unique ID
- [x] Status bar & state logic (🟡 Cached, 🟢 Active, 🔴 Failed)
- [x] Config & utility updates
- [x] Build plan & documentation
- [x] In-memory cache for unsaved workspaces
- [x] Temp file cache for unsaved workspaces
- [x] Seamless transition on workspace save (cache → central)
- [x] Backend integration (vector storage/retrieval, error fallback)
- [x] Robust error handling & automatic recovery
- [x] User notifications & error reporting
- [x] requirements.txt for backend dependencies
- [x] MCP server/extension hybrid for vector store
- [x] Unified /memory_recall_and_store endpoint (recall, logging, dedup, time decay, compliance)
- [x] Store all prompt/response pairs in ChromaDB via the backend
- [x] Implement gradual time decay in the backend search endpoint
- [x] Store timestamps with each vector entry
- [x] Deduplication logic in recall/store
- [x] Compliance fields and scoring in memory entries
- [x] Extension updated to use unified endpoint everywhere
- [x] Documented endpoint for Cursor/agent integration
- [ ] Final documentation & polish
- [ ] Add API versioning to backend endpoints for future-proofing
- [ ] Implement graceful backend shutdown on VS Code close or extension deactivation
- [ ] Implement logic to clean up unused workspace data in `~/.omnivector_workspaces`
- [ ] Add tooltips to status bar icons for clarity
- [ ] Allow a "full history" search override from the extension
- [ ] Add onboarding guide or notification for first-time users
- [ ] Ensure all error states provide actionable feedback and recovery options
- [ ] Document privacy guarantees in the extension README
- [ ] Consider encrypting vector data at rest in the central directory
- [ ] If multi-user, ensure workspace data is isolated and access-controlled
- [ ] Write a clear README for the extension
- [ ] Prepare changelog, icon, and publisher info for VS Code Marketplace
- [ ] Document how to adapt the extension for other IDEs in the future
- [ ] Update documentation to reflect the new, self-contained structure
- [ ] Document the backend API and extension architecture for future contributors
- [ ] Add unit and integration tests for both backend (Python) and extension (TypeScript)
- [ ] Add end-to-end tests simulating real user workflows
- [ ] Aggregate logs from both frontend and backend for easier debugging (optionally expose a "Show Logs" command)
- [ ] Begin scaffolding a settings UI for agent endpoints, decay rate, and compliance options
- [ ] Architect the backend to allow for future plugins (e.g., different vector DBs, compliance modules)
- [ ] Start outlining the phase two orchestration layer for agent-to-agent collaboration

## Immediate Next Steps (as of now)

1. **Polish & Error Handling**
   - Add actionable error messages and fallback logic in the extension and backend.
   - Add tooltips to status bar icons for clarity.
2. **Documentation & Marketplace Prep**
   - Finalize README, changelog, and add an icon for VS Code Marketplace.
   - Document privacy guarantees and onboarding for new users.
3. **Testing & Validation**
   - Add unit and integration tests for both backend and extension.
   - Add end-to-end tests simulating real user workflows.
4. **Backend & Extension Polish**
   - Implement graceful backend shutdown on VS Code close or extension deactivation.
   - Implement logic to clean up unused workspace data in `~/.omnivector_workspaces`.
   - Add API versioning to backend endpoints for future-proofing.

---

# Next Steps (Actionable)

1. **Add actionable error handling and tooltips in the extension.**
2. **Finalize and polish documentation (README, changelog, privacy, onboarding).**
3. **Add and run tests for backend and extension.**
4. **Prepare for VS Code Marketplace release (icon, publisher info, packaging).**
5. **(Optional) Implement backend shutdown and workspace cleanup logic.**

## 1. Project Structure

- The extension and backend are now fully self-contained in `OmniThreads Extension/`.
- The `Pseudovector` folder is no longer needed and can be safely deleted.
- All vector memory and compliance data are stored in a centralized, hidden directory (e.g., `~/.omnivector_workspaces/`).

## 2. Extension Goals

- Enable vector memory for any IDE agent in VS Code.
- Use ChromaDB for local, private vector storage.
- Feature time-decayed recall (limit search window unless overridden).
- Provide robust logging, audit, and error handling as described in the system overview.
- Ensure a seamless, plug-and-play user experience with no manual setup or visible project folder clutter.

## 3. Next Steps

### 3.1. Extension Scaffolding

- [x] Initialize a new VS Code extension in `OmniThreads Extension/` (TypeScript, package.json, etc.).
- [x] Set up basic commands, activation events, and status bar item.

### 3.2. Backend Integration

- [x] Define how the extension will start and communicate with the Python backend (subprocess, port management, etc.).
- [x] Document the API endpoints (log, search, status) provided by the backend.
- [x] Ensure the backend can be started/stopped cleanly from the extension.

### 3.3. Centralized Workspace Management

- [x] On workspace open, generate a unique ID for the workspace (auto, no user input; use hash of path or VS Code workspace ID).
- [x] Store all vector memory and compliance data in a subfolder of the central directory, named by the unique ID.
- [x] For unsaved workspaces, cache conversation pairs in memory (or a temp file). If the user saves the workspace, move the cache to the new folder. If not, discard the cache on close.
- [x] No compliance files or clutter in the user's project folders.

### 3.4. Status Bar & State Logic

- [x] Status bar always starts with `OmniThreads:`
- [x] Show 🟡 Cached for new/unsaved workspaces or when data is being cached.
- [x] Show 🟢 Active for saved workspaces with data stored in the central directory.
- [x] Show 🔴 Failed - Storing in Cache if there is an error saving to the main store (with logic to reconnect/merge later).
- [x] Status bar and state logic are extensible for future features.

### 3.5. Vector Memory & Time Decay

- [x] Store all prompt/response pairs in ChromaDB via the backend.
- [x] **Implement gradual time decay in the backend search endpoint:**
    - <15 days: Full relevance (factor 1.0)
    - 15–30 days: Slightly reduced (factor 0.8)
    - 30–45 days: More reduced (factor 0.6)
    - 45–60 days: Even more reduced (factor 0.4)
    - 60–90 days: Lowest relevance before cutoff (factor 0.2)
    - >90 days: Only included if user explicitly requests (factor 0.0 or configurable)
- [x] Store timestamps with each vector entry.
- [ ] Allow a "full history" search override from the extension.
- [ ] Allow users to adjust the time decay rate via a settings panel.

### 3.6. User Experience

- [x] Status bar and all logic are seamless and automatic for the user.
- [x] Error notifications with "Report Issue" button.
- [x] Automatic handling of backend errors, cache fallback, and user prompts.

### 3.7. Privacy & Security

- [x] Ensure all data is stored locally unless user opts in to error reporting.

### 3.8. Documentation & Marketplace Readiness

- [ ] Write a clear README for the extension.
- [ ] Prepare changelog, icon, and publisher info for VS Code Marketplace.
- [ ] Document how to adapt the extension for other IDEs in the future.
- [ ] Update documentation to reflect the new, self-contained structure.
- [ ] Document the backend API and extension architecture for future contributors.

### 3.9. Testing & Validation

- [ ] Add unit and integration tests for both backend (Python) and extension (TypeScript).
- [ ] Add end-to-end tests simulating real user workflows.
- [ ] Aggregate logs from both frontend and backend for easier debugging (optionally expose a "Show Logs" command).

### 3.10. Extension Architecture & Future-Proofing

- [ ] Begin scaffolding a settings UI for agent endpoints, decay rate, and compliance options.
- [ ] Architect the backend to allow for future plugins (e.g., different vector DBs, compliance modules).
- [ ] Start outlining the phase two orchestration layer for agent-to-agent collaboration.

## 4. Future Considerations

- Modularize backend for use with other IDEs.
- Add advanced search filters and multi-user support.
- Integrate with Sentry or webhooks for error reporting (optional).
- Add more status bar states as new features are added.
- **Dashboard or settings panel for easy plug-and-play configuration of OpenAI, Anthropic, Grok, Gemini, Mistral, and OpenRouter endpoints, allowing users to connect their own agent.**
- **Phase two: Orchestration layer to enable your agent to work with an IDE agent (if possible), supporting agent-to-agent collaboration.**

## Immediate Action Plan

1. **Scaffold the Node.js MCP Server**
   - Expose MCP protocol endpoints (stdio/SSE, HTTP)
   - Implement basic vector memory tools: `add_memory`, `search_memory`, `recall_memory`
   - Use in-memory storage for now (easy to swap for microservice later)
   - Log all requests for debugging

2. **Integrate with the Extension**
   - Add logic to auto-start/connect to the MCP server
   - Register MCP tools with the extension UI
   - Allow agents (e.g., Copilot, Cursor) to discover and use the MCP tools

3. **Test End-to-End**
   - Use a test agent or MCP client to call the tools via the extension
   - Confirm that memory is being stored, searched, and recalled as expected

4. **Prepare for Backend/Microservice Integration**
   - Define the API contract for swapping in the Python vector memory service
   - Plan for seamless upgrade from in-memory to microservice backend

---

**Immediate Next Steps:**
1. Test the extension and backend end-to-end to ensure no references to `Pseudovector` remain and all features work as expected.
2. Implement any missing error handling, onboarding, and polish steps from above.
3. Begin adding automated tests and documentation for maintainability and future expansion.

## Internal-Only Settings (Developer Reference)

All internal configuration values (such as time decay rate, full history search toggle, etc.) are centralized in `src/config.ts`.

- These are **not user-tunable** and should only be changed by developers or advanced users.
- Example settings:
  - `TIME_DECAY_RATE`: Default decay rate for vector memory relevance
  - `ENABLE_FULL_HISTORY_SEARCH`: Allow full history search override
- Add new internal settings to `src/config.ts` as needed.

## Planned: Add SSE (Server-Sent Events) Support for MCP Server

To enable full compatibility with Cursor and other agents expecting SSE, add an SSE endpoint to the Node.js MCP server. This will allow streaming tool discovery and/or event updates.

### Steps to Add SSE Support:
1. **Research Cursor's SSE requirements:**
   - Determine the expected SSE endpoint (e.g., `/mcp/events`, `/mcp/sse`, or base `/mcp`).
   - Identify what events or data Cursor expects to receive (tool list, tool updates, etc.).
2. **Implement SSE endpoint in `mcp_server.js`:**
   - Use Express or a compatible library to add an SSE route (e.g., `/mcp/events`).
   - On client connect, send the current tool list as an SSE event.
   - Optionally, stream updates if tools change or new events occur.
3. **Test with Cursor:**
   - Register the MCP server in Cursor with the SSE endpoint.
   - Confirm Cursor can connect and discover tools.
4. **Document SSE support:**
   - Update README and build plan with SSE usage and configuration.

**Note:** SSE is not required for basic HTTP tool calls, but is needed for full Cursor integration.

## MCP Server Lifecycle Management & Seamless User Experience

### Breakdown & Required Features
- SSE Endpoint for real-time query/retrieval (no storage).
- Stdio Command for prompt-response storage/embedding (no retrieval).
- Both are part of the same MCP server codebase, but are separate entry points.
- Extension auto-detects Cursor AI and sets up everything (ChromaDB, MCP server, ports).
- No manual commands required from the user.
- Extension provides copy-paste MCP config for Cursor (with port info).
- Handles port conflicts and provides user-friendly prompts if needed.
- All requirements (Node, Python, ChromaDB, etc.) are installed automatically or with clear prompts.
- MCP server is started when the platform/extension is launched and stopped when it is closed.

### How We'll Accomplish This
1. MCP Server (Node.js)
   - Add SSE endpoint for retrieval (e.g., `/mcp/events`).
   - Add stdio command for storage (e.g., `node mcp_server.js store`).
   - Share vector store logic between both entry points.
   - Advertise both tools in `/mcp/tools` with correct types (`sse` and `stdio`).
2. Extension (VS Code)
   - On install/first run:
     - Detect Cursor AI.
     - Install dependencies (Node, Python, ChromaDB).
     - Start MCP server (both SSE and stdio).
     - Detect and resolve port conflicts.
     - Display MCP config for Cursor (with correct port).
   - On deactivate/close:
     - Stop MCP server process.
   - Settings/Instructions:
     - Provide copy-paste config for Cursor MCP settings.
     - Update instructions if port is not default.
3. Documentation
   - Update README and onboarding with new flow and instructions.

### Next Steps & Instructions
1. Implement SSE and stdio entry points in MCP server.
2. Refactor extension for onboarding, auto-setup, and MCP server lifecycle management.
3. Update tool discovery and schemas.
4. Test end-to-end with Cursor AI.
5. Update documentation and onboarding.
6. Remove/clean up legacy code as needed.

**Instructions for Users (to be included in onboarding/README):**
- Install the extension.
- On first run, the extension will auto-detect Cursor AI, install dependencies, and start the MCP server.
- If the default port is taken, the extension will prompt you and provide updated instructions.
- Copy the provided MCP config into Cursor's settings.
- The MCP server will start automatically with VS Code and stop when you close it—no manual commands needed.

---

