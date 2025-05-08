# OmniThreads Extension Build Plan (18/35)

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
- [ ] Final documentation & polish
- [ ] Add API versioning to backend endpoints for future-proofing
- [ ] Implement graceful backend shutdown on VS Code close or extension deactivation
- [ ] Implement logic to clean up unused workspace data in `~/.omnivector_workspaces`
- [ ] Add tooltips to status bar icons for clarity
- [x] Store all prompt/response pairs in ChromaDB via the backend
- [x] Implement gradual time decay in the backend search endpoint
- [x] Store timestamps with each vector entry
- [ ] Allow a "full history" search override from the extension
- [ ] Allow users to adjust the time decay rate via a settings panel
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

## Immediate Next Steps

1. **Top Priority: MCP Server/Extension Hybrid for Vector Store**
   - Design and implement the MCP server/extension hybrid as the first-class vector memory provider for the agent (me/OpenAI) and any IDE agent.
   - Expose vector store functions (add, search, recall, time decay) via MCP and HTTP APIs.
   - Ensure plug-and-play setup for VS Code, Cursor, and custom agents.
   - All other work is secondary until this is functional.

2. **Backend & Core Extension Polish**
   - Add API versioning to backend endpoints
   - Implement graceful backend shutdown on VS Code close or extension deactivation
   - Implement logic to clean up unused workspace data in `~/.omnivector_workspaces`
   - Add tooltips to status bar icons for clarity
   - Allow a "full history" search override from the extension
   - Allow users to adjust the time decay rate via a settings panel

3. **User Experience & Security**
   - Add onboarding guide or notification for first-time users
   - Ensure all error states provide actionable feedback and recovery options
   - Document privacy guarantees in the extension README
   - Consider encrypting vector data at rest in the central directory
   - If multi-user, ensure workspace data is isolated and access-controlled

4. **Documentation, Testing, and Future-Proofing**
   - Write a clear README for the extension
   - Prepare changelog, icon, and publisher info for VS Code Marketplace
   - Document how to adapt the extension for other IDEs in the future
   - Update documentation to reflect the new, self-contained structure
   - Document the backend API and extension architecture for future contributors
   - Add unit and integration tests for both backend (Python) and extension (TypeScript)
   - Add end-to-end tests simulating real user workflows
   - Aggregate logs from both frontend and backend for easier debugging (optionally expose a "Show Logs" command)
   - Begin scaffolding a settings UI for agent endpoints, decay rate, and compliance options
   - Architect the backend to allow for future plugins (e.g., different vector DBs, compliance modules)
   - Start outlining the phase two orchestration layer for agent-to-agent collaboration

**Recommended Order:**
- Complete the MCP server/extension hybrid for vector store first.
- Then proceed with backend polish, UX/security, and documentation/testing as outlined above.

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

