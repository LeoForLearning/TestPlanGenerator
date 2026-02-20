import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router

# Basic logging configuration so background tasks (ingest/reindex) are visible in console.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(title="TestPlanGenerator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "running"}

app.include_router(api_router, prefix="/api")
