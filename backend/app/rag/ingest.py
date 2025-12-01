import hashlib
import uuid
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

import pandas as pd
import logging

from app.rag.vector_store import get_collection

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".csv", ".xls", ".xlsx", ".doc", ".docx", ".pdf"}


def extract_text(file_path: Path) -> str:
    ext = file_path.suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type for indexing: {ext or '<none>'}")

    if ext in {".csv"}:
        df = pd.read_csv(file_path, dtype=str, keep_default_na=False)
        return df.to_csv(index=False)

    if ext in {".xls", ".xlsx"}:
        df = pd.read_excel(file_path, dtype=str, keep_default_na=False)
        return df.to_csv(index=False)

    if ext in {".doc", ".docx"}:
        try:
            import docx  # type: ignore
        except Exception as exc:  # pragma: no cover - optional dependency
            raise RuntimeError("docx parsing requires 'python-docx' installed.") from exc

        doc = docx.Document(file_path)
        return "\n".join(p.text for p in doc.paragraphs)

    if ext in {".pdf"}:
        try:
            import pypdf  # type: ignore
        except Exception as exc:  # pragma: no cover - optional dependency
            raise RuntimeError("PDF parsing requires 'pypdf' installed.") from exc

        reader = pypdf.PdfReader(str(file_path))
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        return "\n".join(pages)

    raise ValueError(f"Unsupported file type for indexing: {ext}")


def chunk_text(text: str, max_chars: int = 1500, overlap: int = 200) -> Iterable[str]:
    """
    Simple character-based chunker with overlap to preserve context.
    """
    text = text.strip()
    if not text:
        return []

    # Prevent infinite loops if overlap is too large
    if overlap >= max_chars:
        overlap = max_chars // 2

    chunks: List[str] = []
    start = 0
    text_len = len(text)
    while start < text_len:
        end = min(start + max_chars, text_len)
        chunks.append(text[start:end])
        next_start = start + max_chars - overlap
        if next_start <= start:
            next_start = end
        start = next_start
    return chunks


def index_file(file_path: Path, metadata: Dict) -> Tuple[bool, str]:
    """
    Extract, chunk, embed, and upsert into ChromaDB.
    """
    if not file_path.exists():
        return False, f"File not found: {file_path}"

    try:
        text = extract_text(file_path)
        chunks = list(chunk_text(text))
        if not chunks:
            return False, "No content extracted from file."

        logger.info("Indexing file %s into collection %s (%s chunks)", file_path, get_collection().name, len(chunks))
        collection = get_collection()
        ids = [f"{file_path.stem}-{uuid.uuid4()}" for _ in chunks]
        metadatas = []
        for idx, _ in enumerate(chunks):
            meta = {
                **metadata,
                "source": str(file_path),
                "chunk": idx,
                "total_chunks": len(chunks),
                "hash": hashlib.md5(f"{file_path}-{idx}".encode()).hexdigest(),
            }
            metadatas.append(meta)

        collection.upsert(
            documents=chunks,
            metadatas=metadatas,
            ids=ids,
        )
        logger.info("Finished indexing %s (%s chunks)", file_path, len(chunks))
        return True, f"Indexed {len(chunks)} chunks."
    except Exception as exc:  # pragma: no cover - robustness
        logger.exception("Indexing failed for %s", file_path)
        return False, str(exc)
