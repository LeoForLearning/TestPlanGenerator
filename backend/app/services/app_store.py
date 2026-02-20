import copy
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

# Store JSON alongside the backend code to keep everything file-based for the POC.
BASE_DIR = Path(__file__).resolve().parent.parent
STORE_PATH = BASE_DIR / "data" / "app_store.json"

DEFAULT_STRUCTURE = {
    "connections": {},
    "settings": {
        "model": "llama3",
        "apiKey": "",
        "llmProvider": "ollama",  # ollama | openai | azure
        "azureEndpoint": "",
        "azureApiVersion": "2024-02-15-preview",
        "azureDeployment": "",
        "planId": "",
        "suiteId": "",
        "temperature": 0.7,
        "autoStoreVerified": True,
        "embedProvider": "ollama",
        "embedModel": "nomic-embed-text",
        "embedBaseUrl": "http://localhost:11434",
        "collectionName": "rag_uploads",
    },
    "uploads": [],
    "generated_tests": [],
    "rag_history": []
}


def _apply_defaults(store: Dict[str, Any]) -> Dict[str, Any]:
    """Merge missing default keys into the current store without overwriting existing values."""
    for section, default_value in DEFAULT_STRUCTURE.items():
        if section not in store:
            store[section] = copy.deepcopy(default_value)
            continue

        if isinstance(default_value, dict) and isinstance(store[section], dict):
            for key, val in default_value.items():
                store[section].setdefault(key, copy.deepcopy(val))
    return store


def _ensure_file() -> None:
    """Ensure file and directories exist with default structure."""
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not STORE_PATH.exists():
        save_store(copy.deepcopy(DEFAULT_STRUCTURE))


def load_store() -> Dict[str, Any]:
    """Load the complete store file."""
    _ensure_file()
    try:
        with STORE_PATH.open("r") as f:
            data = json.load(f)
    except json.JSONDecodeError:
        # Reset to defaults if the JSON becomes corrupted
        data = copy.deepcopy(DEFAULT_STRUCTURE)
        save_store(data)

    return _apply_defaults(data)


def save_store(data: Dict[str, Any]) -> None:
    """Save the entire store atomically."""
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with STORE_PATH.open("w") as f:
        json.dump(data, f, indent=2)


def update_section(section: str, value: Any) -> None:
    """Update one section of the store."""
    store = load_store()
    store[section] = value
    save_store(store)


def append_to_section(section: str, item: Any) -> None:
    """Append to a list-based section (like uploads or test cases)."""
    store = load_store()
    store.setdefault(section, [])
    entry = copy.deepcopy(item)
    if isinstance(entry, dict):
        entry.setdefault("timestamp", datetime.now().isoformat())
    store[section].append(entry)
    save_store(store)


def get_section(section: str) -> Any:
    """Get any section (connections, settings, uploads, etc.)"""
    store = load_store()
    return store.get(section, copy.deepcopy(DEFAULT_STRUCTURE.get(section, {})))
