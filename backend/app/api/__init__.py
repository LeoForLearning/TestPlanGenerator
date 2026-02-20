from fastapi import APIRouter
from .dashboard import router as dashboard_router
from .generate import router as generate_router
from .upload import router as upload_router
from .rag import router as rag_router
from .connections import router as connections_router
from .settings import router as settings_router

api_router = APIRouter()

api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(generate_router, prefix="/generate", tags=["Generate"])
api_router.include_router(upload_router, prefix="/upload", tags=["Upload"])
api_router.include_router(rag_router, prefix="/rag", tags=["RAG"])
api_router.include_router(connections_router, prefix="/connections", tags=["Connections"])
api_router.include_router(settings_router, prefix="/settings", tags=["Settings"])
