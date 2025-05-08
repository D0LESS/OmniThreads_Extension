# OmniThreads Backend API

## Endpoints

### POST `/log`
- **Description:** Log a prompt/response pair to vector memory
- **Body:**
  - `prompt` (str): User prompt
  - `response` (str): Agent response
  - `compliance` (bool, optional): Compliance flag (default: true)
- **Query:**
  - `workspace` (str): Workspace name/ID
- **Returns:** `{ status, reason }`

### GET `/search`
- **Description:** Search vector memory with time decay and optional full history
- **Query:**
  - `query` (str): Search query
  - `workspace` (str): Workspace name/ID
  - `n_results` (int, optional): Number of results (default: 5)
  - `full_history` (bool, optional): Include all history (default: false)
- **Returns:** List of matches with decayed scores, age, and metadata

### GET `/conversations`
- **Description:** List all stored conversations for a workspace
- **Query:**
  - `workspace` (str): Workspace name/ID
- **Returns:** List of all documents/IDs

### GET `/status`
- **Description:** Get backend vector status log
- **Query:**
  - `workspace` (str): Workspace name/ID
- **Returns:** Last status and recent log entries

---
See `session_bootstrapper.py` for implementation details. 