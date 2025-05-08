import os
import argparse
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from .vector_memory import vector_status_signature
import json
import sys
import datetime

CONFIRM_FILE = ".omnivector_workspace"
WORKSPACE_ROOT = os.path.expanduser(r"~/.omnivector_workspaces")

# Workspace setup helpers
def ensure_workspace_structure(workspace_name):
    base = os.path.join(WORKSPACE_ROOT, workspace_name)
    for sub in ["semantic", "state", "context/time_metrics"]:
        os.makedirs(os.path.join(base, sub), exist_ok=True)
    # Ensure vector_status.log exists
    log_path = os.path.join(base, "semantic", "vector_status.log")
    if not os.path.exists(log_path):
        with open(log_path, "w") as f:
            f.write("")
    # Ensure vector_db dir exists
    os.makedirs(os.path.join(base, "semantic", "vector_db"), exist_ok=True)
    # Ensure session_boundaries.json exists
    session_file = os.path.join(base, "state", "session_boundaries.json")
    if not os.path.exists(session_file):
        with open(session_file, "w", encoding="utf-8") as f:
            json.dump({
                "session_id": "default",
                "boundaries": [],
                "created": datetime.datetime.now().isoformat()
            }, f, indent=2)

# Data model for logging
class LogRequest(BaseModel):
    prompt: str
    response: str
    compliance: Optional[bool] = True

app = FastAPI(title="OmniThreads Vector Memory API")

@app.on_event("startup")
def startup_event():
    print(f"\nOmniThreads Vector Memory backend running. API docs at http://localhost:8000/docs\n")

@app.post("/log")
def log_conversation(log: LogRequest, workspace: str = Query(..., description="Workspace name")):
    status, reason = vector_status_signature(
        workspace_name=workspace,
        prompt=log.prompt,
        response=log.response,
        compliance=log.compliance
    )
    return {"status": status, "reason": reason}

@app.get("/conversations")
def get_conversations(workspace: str = Query(..., description="Workspace name")):
    try:
        import chromadb
        from chromadb.config import Settings
        persist_dir = os.path.join(WORKSPACE_ROOT, workspace, "semantic", "vector_db")
        client = chromadb.Client(Settings(persist_directory=persist_dir))
        collection = client.get_or_create_collection("conversations")
        docs = collection.get()
        results = []
        for doc, doc_id in zip(docs.get("documents", []), docs.get("ids", [])):
            results.append({"id": doc_id, "content": doc})
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving conversations: {e}")

@app.get("/search")
def search_conversations(query: str, workspace: str = Query(..., description="Workspace name"), n_results: int = 5, full_history: bool = False):
    try:
        import chromadb
        from chromadb.config import Settings
        import datetime

        persist_dir = os.path.join(WORKSPACE_ROOT, workspace, "semantic", "vector_db")
        client = chromadb.Client(Settings(persist_directory=persist_dir))
        collection = client.get_or_create_collection("conversations")
        results = collection.query(query_texts=[query], n_results=n_results * 3)  # get more for decay filtering

        now = datetime.datetime.now()
        matches = []

        def get_decay_factor(days_old):
            if days_old <= 15:
                return 1.0
            elif days_old <= 30:
                return 0.8
            elif days_old <= 45:
                return 0.6
            elif days_old <= 60:
                return 0.4
            elif days_old <= 90:
                return 0.2
            else:
                return 0.0 if not full_history else 0.05

        # Assume each doc has a timestamp in metadata (add this on insert if not present)
        for doc, doc_id, score, meta in zip(
            results.get("documents", []),
            results.get("ids", []),
            results.get("distances", [[]])[0],
            results.get("metadatas", [[]])[0] if "metadatas" in results else [{}] * len(results.get("documents", []))
        ):
            timestamp = meta.get("timestamp")
            if timestamp:
                try:
                    doc_time = datetime.datetime.fromisoformat(timestamp)
                except Exception:
                    doc_time = now
            else:
                doc_time = now
            days_old = (now - doc_time).days
            decay = get_decay_factor(days_old)
            decayed_score = score * decay
            if decay > 0 or full_history:
                matches.append({
                    "id": doc_id,
                    "content": doc,
                    "score": decayed_score,
                    "age_days": days_old,
                    "raw_score": score,
                    "decay": decay
                })

        # Sort by decayed score and return top n_results
        matches.sort(key=lambda x: x["score"], reverse=True)
        return matches[:n_results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching conversations: {e}")

@app.get("/status")
def get_vector_status(workspace: str = Query(..., description="Workspace name")):
    log_path = os.path.join(WORKSPACE_ROOT, workspace, "semantic", "vector_status.log")
    if not os.path.exists(log_path):
        return {"status": "No log file found."}
    with open(log_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    if not lines:
        return {"status": "No status entries found."}
    last = lines[-1].strip()
    return {"last_status": last, "all_status": lines[-10:]}

def main():
    parser = argparse.ArgumentParser(description="OmniThreads Vector Memory Backend")
    parser.add_argument("--workspace", type=str, default=None, help="Workspace name (overrides autodetect)")
    parser.add_argument("--port", type=int, default=8000, help="Port for API server")
    parser.add_argument("--auto", action="store_true", help="Auto-create workspace if not found, using current folder name")
    args = parser.parse_args()

    # Step 1: Try to find .omnivector_workspace in current directory
    cwd = os.getcwd()
    confirm_path = os.path.join(cwd, CONFIRM_FILE)
    workspace_name = args.workspace
    if not workspace_name:
        if os.path.exists(confirm_path):
            with open(confirm_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                workspace_name = data.get("workspace_name")
            print(f"Found workspace confirmation file. Using workspace: {workspace_name}")
        else:
            if args.auto:
                workspace_name = os.path.basename(cwd)
                print(f"No workspace confirmation file found. Auto-creating workspace: {workspace_name}")
            else:
                workspace_name = input("No workspace confirmation file found. Enter a name for your workspace: ").strip()
    # Step 2: Ensure workspace structure
    ensure_workspace_structure(workspace_name)
    # Step 3: Write confirmation file if not present
    if not os.path.exists(confirm_path):
        with open(confirm_path, "w", encoding="utf-8") as f:
            json.dump({
                "workspace_name": workspace_name,
                "created": datetime.datetime.now().isoformat()
            }, f, indent=2)
        print(f"Created {CONFIRM_FILE} in {cwd} for workspace: {workspace_name}")
    # Step 4: Print the command to run the API
    print("\nTo enable full OmniThreads vector memory and logging for this workspace, run:")
    print(f"python -m OmniThreadsExtension.backend.server.session_bootstrapper --workspace {workspace_name}")
    print("\nOr, if your environment supports it, click the 'Run' button above.")
    # Step 5: Start the API
    uvicorn.run("OmniThreadsExtension.backend.server.session_bootstrapper:app", host="0.0.0.0", port=args.port, reload=False)

if __name__ == "__main__":
    main() 