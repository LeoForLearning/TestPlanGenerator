from fastapi import APIRouter, BackgroundTasks
from app.services.app_store import get_section, update_section, load_store, save_store
from app.models.response import APIResponse
from app.rag.vector_store import reset_collection
from app.workers import tasks

router = APIRouter()

SETTINGS_KEY = "settings"


# -------------------------
# SETTINGS CRUD
# -------------------------
@router.get("/")
async def get_settings():
    settings = get_section(SETTINGS_KEY)
    return APIResponse(success=True, message="Settings loaded", data=settings)


@router.post("/")
async def save_settings(payload: dict):
    update_section(SETTINGS_KEY, payload)
    return APIResponse(success=True, message="Settings updated", data=payload)


@router.delete("/")
async def clear_settings():
    store = load_store()
    if SETTINGS_KEY in store:
        store[SETTINGS_KEY] = {}
        save_store(store)
    return APIResponse(success=True, message="Settings cleared")


# -------------------------
# 🔁 RAG Actions
# -------------------------

@router.post("/reindex")
async def reindex_rag(background_tasks: BackgroundTasks):
    """
    Placeholder — will later rebuild embeddings from stored test cases in RAG DB.
    """
    background_tasks.add_task(tasks.reindex_all_uploads_task)
    return APIResponse(
        success=True,
        message="Re-indexing started.",
        data={"status": "running"}
    )


@router.delete("/rag")
async def clear_rag_data():
    """
    Clears stored embeddings (ChromaDB) — soft reset RAG memory.
    """
    reset_collection()

    store = load_store()
    for upload in store.get("uploads", []):
        upload.update(
            {
                "status": "pending",
                "indexed": False,
            }
        )
        upload.pop("indexMessage", None)
        upload.pop("indexedAt", None)
    save_store(store)

    return APIResponse(
        success=True,
        message="All RAG knowledge cleared.",
        data={"deleted": True}
    )
