from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from app.models.response import APIResponse
from app.services.app_store import append_to_section, get_section
from app.workers import tasks

router = APIRouter()  # REQUIRED

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "data" / "uploads"
ALLOWED_EXTENSIONS = {".xls", ".xlsx", ".csv", ".pdf", ".doc", ".docx"}


def _validate_extension(filename: str) -> None:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )


@router.post("/upload")
async def upload_test_suite(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Accept a single upload for XLS/XLSX/CSV/PDF/DOC/DOCX.
    File is saved locally and metadata is persisted to the JSON store for history.
    Indexing is dispatched to a background task.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="File missing or invalid.")

    _validate_extension(file.filename)

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    content = await file.read()

    safe_name = f"{datetime.utcnow().strftime('%Y%m%dT%H%M%S%f')}_{file.filename}"
    dest_path = UPLOAD_DIR / safe_name
    dest_path.write_bytes(content)

    uploaded_at = datetime.utcnow().isoformat()
    record = {
        "filename": file.filename,
        "storedName": safe_name,
        "size": len(content),
        "contentType": file.content_type,
        "path": str(dest_path),
        "status": "indexing",   # Updated after ingest completes
        "indexed": False,
        "uploadedAt": uploaded_at,
        "timestamp": uploaded_at,
    }
    append_to_section("uploads", record)

    background_tasks.add_task(tasks.ingest_file_task, record["storedName"], record)

    return APIResponse(
        success=True,
        message="File uploaded; indexing scheduled.",
        data=record,
    )


@router.get("/history")
async def upload_history():
    """
    Return upload history from the JSON store.
    """
    uploads = get_section("uploads")
    return APIResponse(
        success=True,
        message="Upload history loaded.",
        data=uploads,
    )
