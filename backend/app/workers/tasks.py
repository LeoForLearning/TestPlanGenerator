from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Tuple

import logging

from app.rag import ingest
from app.rag.vector_store import reset_collection
from app.services.app_store import load_store, save_store

logger = logging.getLogger(__name__)


def _index_upload_record(record: Dict[str, Any]) -> Tuple[bool, str, str]:
    """
    Index a single upload record. Returns (indexed, message, indexed_at).
    """
    path_val = record.get("path") or ""
    file_path = Path(path_val)
    if (not path_val) or (not file_path.exists()) or (not file_path.is_file()):
        return False, f"File not found or invalid path: {path_val}", None

    logger.info("Starting indexing for %s", file_path)
    indexed, msg = ingest.index_file(file_path, {"filename": record.get("filename")})
    indexed_at = datetime.utcnow().isoformat() if indexed else None
    logger.info("Indexing result for %s -> %s (%s)", file_path, indexed, msg)
    return indexed, msg, indexed_at


def ingest_file_task(stored_name: str, record: Dict[str, Any]) -> None:
    """
    Background task: index the uploaded file and update the upload history status.
    """
    indexed, msg, indexed_at = _index_upload_record(record)

    store = load_store()
    for upload in store.get("uploads", []):
        if upload.get("storedName") == stored_name:
            upload.update(
                {
                    "status": "indexed" if indexed else "failed",
                    "indexed": indexed,
                    "indexedAt": indexed_at,
                    "indexMessage": msg,
                }
            )
            break
    save_store(store)


def reindex_all_uploads_task() -> None:
    """
    Clears vector store and re-indexes all stored uploads.
    """
    logger.info("Resetting vector store and reindexing all uploads.")
    reset_collection()
    store = load_store()
    uploads = store.get("uploads", [])

    for upload in uploads:
        upload["status"] = "indexing"
        upload["indexed"] = False
        upload.pop("indexMessage", None)
        upload.pop("indexedAt", None)

    save_store(store)

    for upload in uploads:
        indexed, msg, indexed_at = _index_upload_record(upload)
        upload.update(
            {
                "status": "indexed" if indexed else "failed",
                "indexed": indexed,
                "indexedAt": indexed_at,
                "indexMessage": msg,
            }
        )
        save_store(store)
    logger.info("Reindex completed for %s uploads", len(uploads))
