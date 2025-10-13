import chromadb
from sentence_transformers import SentenceTransformer
from src.config import EMBED_MODEL, CHROMA_COLLECTION

embedding_model = SentenceTransformer(EMBED_MODEL)
chroma = chromadb.Client()
collection = chroma.get_or_create_collection(CHROMA_COLLECTION)

def embed_and_store(wid, text, title):
    emb = embedding_model.encode([text])[0]
    collection.add(
        ids=[str(wid)], documents=[text], embeddings=[emb.tolist()],
        metadatas=[{"title": title}]
    )

def query_similar(text, top_k=3):
    query_emb = embedding_model.encode([text])[0]
    return collection.query(query_embeddings=[query_emb.tolist()], n_results=top_k)
