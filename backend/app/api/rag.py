from fastapi import APIRouter
from app.models.response import APIResponse

router = APIRouter()  # <-- REQUIRED NAME


@router.get("/status")
async def rag_status():
    return APIResponse(
        success=True,
        message="RAG module is live (placeholder).",
        data={"ready": False}
    )


@router.post("/add-generated")
async def store_generated_test_cases(data: dict):
    """
    Placeholder for storing generated tests into ChromaDB later.
    """

    return APIResponse(
        success=True,
        message="Test cases received and queued for RAG indexing.",
        data={"items": len(data.get("testCases", []))}
    )
