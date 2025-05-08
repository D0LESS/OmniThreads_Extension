import os
import datetime

# Use the OmniThreads central workspace directory
WORKSPACE_ROOT = os.path.expanduser(r"~/.omnivector_workspaces")

def log_vector_status(workspace_name, status, reason=None):
    """Log vector status with timestamp and reason to vector_status.log in the workspace semantic folder."""
    log_dir = os.path.join(WORKSPACE_ROOT, workspace_name, "semantic")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "vector_status.log")
    timestamp = datetime.datetime.now().isoformat()
    with open(log_file, "a", encoding="utf-8") as f:
        line = f"[{timestamp}] Vector Status: {status}"
        if reason:
            line += f" | Reason: {reason}"
        f.write(line + "\n")
    # Also log errors to error.log if status is FAILED
    if status == "FAILED" or status == "OFF":
        error_file = os.path.join(log_dir, "error.log")
        with open(error_file, "a", encoding="utf-8") as ef:
            ef.write(f"[{timestamp}] {status}: {reason}\n")

# Error messages for vector failures/off
VECTOR_ERROR_MESSAGES = {
    "import_error": "ChromaDB or Sentence Transformers not installed.",
    "chroma_connection": "Could not connect to ChromaDB persistent storage.",
    "embedding_error": "SentenceTransformer model failed to encode.",
    "unexpected": "Unexpected error during vector operation.",
    "off": "Vector logging was skipped due to non-compliance with OmniThreads rules.",
}

def vector_status_signature(workspace_name=None, prompt=None, response=None, compliance=True):
    """
    Attempts to store prompt/response in persistent vector DB. Logs status (ON, FAILED, OFF) with timestamp and reason.
    Returns (status, reason) for display in assistant response.
    """
    if not compliance:
        log_vector_status(workspace_name, "OFF", VECTOR_ERROR_MESSAGES["off"])
        return "OFF", VECTOR_ERROR_MESSAGES["off"]
    try:
        try:
            import chromadb
            from chromadb.config import Settings
            from sentence_transformers import SentenceTransformer
        except ImportError:
            log_vector_status(workspace_name, "FAILED", VECTOR_ERROR_MESSAGES["import_error"])
            return "FAILED", VECTOR_ERROR_MESSAGES["import_error"]

        persist_dir = None
        if workspace_name:
            persist_dir = os.path.join(
                WORKSPACE_ROOT, workspace_name, "semantic", "vector_db"
            )
            os.makedirs(persist_dir, exist_ok=True)

        # Check ChromaDB connection
        try:
            if persist_dir:
                client = chromadb.Client(Settings(persist_directory=persist_dir))
            else:
                client = chromadb.Client()
            _ = client.list_collections()
        except Exception as e:
            log_vector_status(workspace_name, "FAILED", VECTOR_ERROR_MESSAGES["chroma_connection"] + f" ({e})")
            return "FAILED", VECTOR_ERROR_MESSAGES["chroma_connection"] + f" ({e})"

        # Check SentenceTransformer model
        try:
            model = SentenceTransformer('all-MiniLM-L6-v2')
            _ = model.encode("test")
        except Exception as e:
            log_vector_status(workspace_name, "FAILED", VECTOR_ERROR_MESSAGES["embedding_error"] + f" ({e})")
            return "FAILED", VECTOR_ERROR_MESSAGES["embedding_error"] + f" ({e})"

        # Store prompt/response in vector DB (pseudo-code, replace with actual logic as needed)
        try:
            if prompt and response:
                # Example: store as a document (actual implementation may vary)
                collection = client.get_or_create_collection("conversations")
                doc_id = f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S%f')}"
                collection.add(
                    documents=[f"Prompt: {prompt}\nResponse: {response}"],
                    ids=[doc_id],
                    metadatas=[{"timestamp": datetime.datetime.now().isoformat()}]
                )
        except Exception as e:
            log_vector_status(workspace_name, "FAILED", VECTOR_ERROR_MESSAGES["unexpected"] + f" ({e})")
            return "FAILED", VECTOR_ERROR_MESSAGES["unexpected"] + f" ({e})"

        log_vector_status(workspace_name, "ON")
        return "ON", None
    except Exception as e:
        log_vector_status(workspace_name, "FAILED", VECTOR_ERROR_MESSAGES["unexpected"] + f" ({e})")
        return "FAILED", VECTOR_ERROR_MESSAGES["unexpected"] + f" ({e})" 