# OmniThreads Extension Build Plan (Updated)

## 1. What We've Done

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
- [x] Store all prompt/response pairs in ChromaDB via the backend
- [x] Implement gradual time decay in the backend search endpoint
- [x] Store timestamps with each vector entry
- [x] MCP server scaffolded and tested (add/search/recall endpoints working)
- [x] Extension integration started (mcpClient.ts, commands, README updated)
- [x] Project pushed to GitHub with CI for build/test
- [x] Documentation and onboarding improved
- [x] Directory renamed to remove spaces for Python compatibility
- [x] Unified startup script launches both backend and MCP server
- [x] Workspace name is dynamic and isolated

---

## 2. Immediate Next Steps

1. **Finalize Unified Memory Tool and API**
   - Refactor MCP server to expose a single `/memory_recall_and_store` endpoint that:
     - Fetches relevant memory (vector search + time-decay)
     - Logs new prompt-response pairs (with deduplication)
   - Update extension and agent logic to always use this tool before generating a response.
   - Add fallback logic for memory requests (extension → MCP server if local fails).
   - Only inject top N (e.g., 5) most relevant memories into agent prompts.

2. **Deduplication and Reliable Logging**
   - Implement deduplication logic in the backend (hash or fuzzy match on prompt/response pairs).
   - The extension/agent should maintain a rolling buffer of the last 4 prompt-response pairs.
   - When logging, always send these last 4 pairs (plus the current one) in the `last_pairs` field to the `/memory_recall_and_store` endpoint.
   - The server will deduplicate and store only unique pairs.
   - Reconstruct a clean, timestamp-ordered conversation log from unique pairs.

3. **Testing and Validation**
   - Add/expand unit, integration, and end-to-end tests for the unified tool, deduplication, and fallback logic.
   - Test extension and backend end-to-end to ensure all features work as expected.

4. **Documentation and Onboarding**
   - Update README and onboarding docs to reflect the new unified tool and workflow.
   - Add a practical guide for adapting the extension for other IDEs (emphasize MCP API as the integration point).
   - Document troubleshooting tips for common issues (e.g., import errors, directory naming).

5. **Polish and Beta Readiness**
   - Finalize error/status transparency in the extension (status bar, notifications).
   - Prepare changelog, icon, and publisher info for VS Code Marketplace.
   - Prepare for public beta release and feedback collection.

---

## 3. Detailed Plan: Getting the MCP Server & Memory System Production-Ready

### 3.1. Unified MCP Server API
- [ ] Refactor MCP server to expose `/memory_recall_and_store` endpoint:
    - Input: `{ query, response (optional), k (default 5), last_pairs: [ { query, response }, ... ] }`
    - Output: `{ memory_context, status }`
    - Internally: Fetch top-k relevant memories (vector search * time-decay), log new pair if provided, deduplicate.
    - When logging, always send the last 4 prompt-response pairs (plus the current one) in the `last_pairs` field.
    - Example payload:
      ```json
      {
        "query": "current prompt",
        "response": "current response",
        "k": 5,
        "last_pairs": [
          { "query": "previous prompt 1", "response": "previous response 1" },
          { "query": "previous prompt 2", "response": "previous response 2" },
          { "query": "previous prompt 3", "response": "previous response 3" },
          { "query": "previous prompt 4", "response": "previous response 4" }
        ]
      }
      ```
- [ ] Add deduplication logic (hash or fuzzy match on prompt/response pairs).
- [ ] Store all entries with timestamps and unique IDs.
- [ ] Ensure API is agent-agnostic and well-documented (OpenAPI/Swagger if possible).

### 3.2. Extension/Agent Integration
- [ ] Update extension logic to always call `/memory_recall_and_store` before agent response.
- [ ] Inject only the top N relevant memories into the agent prompt.
- [ ] Add fallback logic: if local memory fails, route to MCP server.
- [ ] Add system prompt or onboarding tip: "Always use memory_recall_and_store before answering."

### 3.3. Logging, Auditing, and Compliance
- [ ] Log tool usage in the MCP server and flag if usage drops below a threshold (e.g., 70%).
- [ ] Provide a way to reconstruct a clean, timestamp-ordered conversation log.
- [ ] Ensure all error states provide actionable feedback and recovery options.

### 3.4. Scalability, Security, and Extensibility
- [ ] If ChromaDB is a bottleneck, consider FAISS or Pinecone for vector search.
- [ ] Add basic encryption for stored data if sensitive.
- [ ] Architect backend for plugins/adaptors (future vector DBs, compliance modules).
- [ ] Document the MCP API clearly for other IDEs/agents.

### 3.5. Testing & Validation
- [ ] Add/expand unit, integration, and end-to-end tests for backend and extension.
- [ ] Ensure automated tests pass in CI (GitHub Actions).
- [ ] Aggregate logs from both frontend and backend for easier debugging (optionally expose a "Show Logs" command).

### 3.6. Documentation & Marketplace Readiness
- [ ] Write a clear README for the extension and backend.
- [ ] Prepare changelog, icon, and publisher info for VS Code Marketplace.
- [ ] Add a section: "How to Adapt for Other IDEs" (focus on calling the MCP API).
- [ ] Add CONTRIBUTING.md and CODE_OF_CONDUCT.md for open source contributors.

---

## 4. Beta Readiness Checklist
- [ ] README: Clear setup, usage, and troubleshooting instructions.
- [ ] CHANGELOG: Up-to-date with all recent changes.
- [ ] Automated Tests: Passing in CI (GitHub Actions).
- [ ] VSIX Package: Built and tested locally.
- [ ] MCP Server: Easy to start, with clear logs and error messages.
- [ ] Extension: Handles all expected user actions and errors gracefully.
- [ ] Feedback Mechanism: Simple way for beta testers to report bugs or suggestions.

## 5. Forward-Thinking & Future-Proofing

- **Agent-Agnostic Protocol & SDKs:**
  - Document the MCP API/protocol clearly so other agents (not just VS Code) can integrate easily.
  - Consider publishing a simple SDK or client library for MCP in Python/JS.
- **Security & Privacy:**
  - Plan for encrypted storage and transport (HTTPS, encrypted DB/files).
  - Add a privacy policy and clear user controls for memory management (view/delete/export).
- **Extensibility & Plugins:**
  - Design the MCP server to support plugins or adapters for different vector DBs or memory strategies.
  - Architect backend for plugins/adaptors (future vector DBs, compliance modules).
  - Consider a plugin/marketplace system for future community contributions.
- **Onboarding & UX:**
  - Add onboarding tips or a welcome screen in the extension for first-time users.
  - Provide sample memory actions or a demo mode for new users.
  - Make workspace selection more user-friendly (e.g., via UI or config file).
- **Future Integrations:**
  - Explore browser extension or system tray app for universal clipboard logging (opt-in, privacy-first).
  - Plan for multi-agent support (multiple IDEs, chatbots, etc.) with user/account separation.
- **Documentation & Community:**
  - Auto-generate and publish MCP server API docs (Swagger/OpenAPI).
  - Add CONTRIBUTING.md and CODE_OF_CONDUCT.md for open source contributors.
  - Keep OmniThreadsOS.roadmap.md updated and public for transparency.
- **Advanced Features:**
  - Modularize backend for use with other IDEs and agents.
  - Add advanced search filters and multi-user support.
  - Integrate with Sentry or webhooks for error reporting (optional).
  - Add more status bar states as new features are added.
  - Dashboard/settings panel for easy configuration of agent endpoints and compliance options.
  - Begin scaffolding a settings UI for agent endpoints, decay rate, and compliance options.
- **Orchestration & Collaboration:**
  - Phase two: Orchestration layer for agent-to-agent collaboration.
- **DevOps & Reliability:**
  - Consider Docker Compose or process manager for easier multi-service startup.
  - Add health checks to the startup script for robust service readiness.

---



