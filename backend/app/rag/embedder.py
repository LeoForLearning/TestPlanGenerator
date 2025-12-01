import hashlib
import os
from typing import List, Sequence, Tuple

import numpy as np
import requests
from chromadb.utils import embedding_functions

from app.services import app_store

DEFAULT_MODEL = os.getenv("RAG_EMBED_MODEL") or os.getenv("EMBED_MODEL") or "all-MiniLM-L6-v2"
HASH_DIM = int(os.getenv("HASH_EMBED_DIM", "256"))
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")


class HashEmbeddingFunction:
    """
    Lightweight, dependency-free embedding fallback using a hashing trick.
    Produces deterministic bag-of-words vectors.
    """

    def __init__(self, dim: int = HASH_DIM):
        self.dim = dim

    def __call__(self, input: Sequence[str]) -> List[List[float]]:
        texts = list(input)
        vectors: List[List[float]] = []
        for text in texts:
            vec = np.zeros(self.dim, dtype=float)
            for token in text.split():
                h = int(hashlib.md5(token.encode()).hexdigest(), 16)
                vec[h % self.dim] += 1.0
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec /= norm
            vectors.append(vec.tolist())
        return vectors


class OllamaEmbeddingFunction:
    """
    Use Ollama's /api/embeddings endpoint for local embeddings.
    """

    def __init__(self, model: str, base_url: str = OLLAMA_BASE_URL):
        self.model = model
        self.base_url = base_url.rstrip("/")

    def __call__(self, input: Sequence[str]) -> List[List[float]]:
        texts = list(input)
        vectors: List[List[float]] = []
        for text in texts:
            # Try /api/embeddings (current); fallback to /api/embedding for older versions.
            endpoints = ["/api/embeddings", "/api/embedding"]
            last_err = None
            for ep in endpoints:
                try:
                    resp = requests.post(
                        f"{self.base_url}{ep}",
                        json={"model": self.model, "prompt": text},
                        timeout=30,
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    vectors.append(data["embedding"])
                    last_err = None
                    break
                except Exception as exc:
                    last_err = exc
                    continue
            if last_err:
                raise last_err
        return vectors


def get_embed_config() -> Tuple[str, str, str]:
    """
    Pull embedding provider/model from settings if present; fall back to env/default.
    """
    settings = app_store.get_section("settings")
    provider = str(settings.get("embedProvider", "") or os.getenv("EMBED_PROVIDER", "")).lower().strip()
    model = settings.get("embedModel") or os.getenv("RAG_EMBED_MODEL") or os.getenv("EMBED_MODEL") or DEFAULT_MODEL
    base_url = settings.get("embedBaseUrl") or os.getenv("OLLAMA_BASE_URL") or OLLAMA_BASE_URL

    if provider not in {"ollama", "sentence_transformer", "hash", ""}:
        provider = "sentence_transformer"

    if not model:
        model = DEFAULT_MODEL

    return provider or "sentence_transformer", model, base_url.rstrip("/") if base_url else ""


def get_embedding_function():
    """
    Prefer user-configured provider/model from settings; fall back gracefully.
    """
    provider, model, base_url = get_embed_config()

    # Explicit hash provider to skip any model/HTTP entirely
    if provider == "hash":
        return HashEmbeddingFunction()

    # Ollama embeddings (no API key needed)
    if provider == "ollama":
        try:
            return OllamaEmbeddingFunction(model=model, base_url=base_url or OLLAMA_BASE_URL)
        except Exception:
            # Fall through to hash if Ollama unavailable
            return HashEmbeddingFunction()

    # SentenceTransformer (local model, may download if available)
    try:
        return embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=model
        )
    except Exception:
        # Safe fallback: hash-based embeddings keep the pipeline running
        return HashEmbeddingFunction()
