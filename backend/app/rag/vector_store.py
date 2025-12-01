import os
from pathlib import Path
from typing import Optional

import chromadb
from chromadb.config import Settings

from app.rag.embedder import get_embedding_function, get_embed_config
from app.services import app_store

CHROMA_DIR = Path(
    os.getenv("CHROMA_PATH", Path(__file__).resolve().parent.parent / "data" / "chroma")
)
DEFAULT_COLLECTION = os.getenv("CHROMA_COLLECTION", "rag_uploads")
ANON_TELEMETRY = os.getenv("CHROMA_TELEMETRY", "false").lower() not in {"0", "false", "no"}

_client: Optional[chromadb.Client] = None
_collection = None
_embed_signature: Optional[tuple] = None


def get_client() -> chromadb.Client:
    global _client
    if _client is None:
        CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        _client = chromadb.PersistentClient(
            path=str(CHROMA_DIR),
            settings=Settings(anonymized_telemetry=ANON_TELEMETRY),
        )
    return _client


def get_collection():
    global _collection, _embed_signature
    settings = app_store.get_section("settings")
    collection_name = settings.get("collectionName") or DEFAULT_COLLECTION
    current_signature = (*get_embed_config(), collection_name)

    # If collection is missing or embed config changed, recreate to align with new settings.
    if _collection is None or _embed_signature != current_signature:
        client = get_client()
        try:
            client.delete_collection(name=collection_name)
        except Exception:
            pass
        _collection = client.get_or_create_collection(
            name=collection_name,
            embedding_function=get_embedding_function(),
        )
        _embed_signature = current_signature
    return _collection


def reset_collection() -> None:
    """
    Delete all vectors from the collection (used by reindex/reset endpoints).
    """
    global _collection, _embed_signature
    try:
        col = get_collection()
        col.delete(where={})  # Deletes all entries in collection
    except Exception:
        # If delete fails or collection missing, recreate it
        client = get_client()
        try:
            settings = app_store.get_section("settings")
            collection_name = settings.get("collectionName") or DEFAULT_COLLECTION
            client.delete_collection(name=collection_name)
        except Exception:
            # Ignore if it truly doesn't exist
            pass
    # Always drop cached handle/signature and recreate a fresh collection
    _collection = None
    _embed_signature = None
    _ = get_collection()
