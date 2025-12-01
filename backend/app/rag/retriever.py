from typing import Any, Dict, List

from app.rag.vector_store import get_collection


def retrieve(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Simple similarity search against the Chroma collection using the configured
    embedding function. Returns a list of hits with id, document, metadata, and distance.
    """
    col = get_collection()
    result = col.query(query_texts=[query], n_results=top_k)

    hits: List[Dict[str, Any]] = []
    ids = result.get("ids", [[]])[0]
    docs = result.get("documents", [[]])[0]
    metas = result.get("metadatas", [[]])[0]
    dists = result.get("distances", [[]])[0] if "distances" in result else [None] * len(ids)

    for idx, doc_id in enumerate(ids):
        hits.append(
            {
                "id": doc_id,
                "document": docs[idx] if idx < len(docs) else "",
                "metadata": metas[idx] if idx < len(metas) else {},
                "distance": dists[idx] if idx < len(dists) else None,
            }
        )

    return hits
