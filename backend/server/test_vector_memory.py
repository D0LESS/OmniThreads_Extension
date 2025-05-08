import pytest
from backend.server import vector_memory

# Mock workspace name for tests
test_workspace = "test_workspace"

def test_vector_status_signature_success(monkeypatch):
    # Patch chromadb and SentenceTransformer to avoid real imports
    monkeypatch.setitem(__import__('sys').modules, 'chromadb', type('Mock', (), {'Client': lambda *a, **k: type('C', (), {'list_collections': lambda self: []})()})())
    monkeypatch.setitem(__import__('sys').modules, 'chromadb.config', type('Mock', (), {'Settings': lambda *a, **k: None})())
    monkeypatch.setitem(__import__('sys').modules, 'sentence_transformers', type('Mock', (), {'SentenceTransformer': lambda *a, **k: type('M', (), {'encode': lambda self, x: [0.1, 0.2]})()})())
    status, reason = vector_memory.vector_status_signature(test_workspace, "prompt", "response", compliance=True)
    assert status == "ON"
    assert reason is None

def test_vector_status_signature_compliance_off():
    status, reason = vector_memory.vector_status_signature(test_workspace, "prompt", "response", compliance=False)
    assert status == "OFF"
    assert "non-compliance" in reason.lower()

def test_vector_status_signature_import_error(monkeypatch):
    monkeypatch.setitem(__import__('sys').modules, 'chromadb', None)
    monkeypatch.setitem(__import__('sys').modules, 'chromadb.config', None)
    monkeypatch.setitem(__import__('sys').modules, 'sentence_transformers', None)
    status, reason = vector_memory.vector_status_signature(test_workspace, "prompt", "response", compliance=True)
    assert status == "FAILED"
    assert "not installed" in reason.lower() 