import os
import chromadb
from chromadb.utils import embedding_functions
from app.utils.logger import logger

CHROMA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "chroma_db")

_client = None
_collection = None

def _get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=CHROMA_PATH)
        ef = embedding_functions.DefaultEmbeddingFunction()
        _collection = _client.get_or_create_collection(
            name="meetings",
            embedding_function=ef
        )
    return _collection

def store_meeting(meeting_id: str, title: str, date: str, participants: str, text: str, summary: str):
    col = _get_collection()
    # Store full transcript
    col.upsert(
        documents=[text],
        metadatas=[{
            "meeting_id": meeting_id,
            "title": title,
            "date": date,
            "participants": participants,
            "source": "transcript"
        }],
        ids=[f"{meeting_id}_transcript"]
    )
    # Store summary
    col.upsert(
        documents=[summary],
        metadatas=[{
            "meeting_id": meeting_id,
            "title": title,
            "date": date,
            "participants": participants,
            "source": "summary"
        }],
        ids=[f"{meeting_id}_summary"]
    )
    logger.info(f"Stored meeting {meeting_id} in vector store.")

def query_meetings(query: str, n_results: int = 4):
    col = _get_collection()
    try:
        results = col.query(
            query_texts=[query],
            n_results=min(n_results, col.count()) if col.count() > 0 else 1
        )
        out = []
        if results and results.get("documents"):
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            distances = results.get("distances", [[1.0]*len(docs)])[0]
            for doc, meta, dist in zip(docs, metas, distances):
                out.append({
                    "meeting_id": meta.get("meeting_id", ""),
                    "title": meta.get("title", ""),
                    "date": meta.get("date", ""),
                    "participants": meta.get("participants", ""),
                    "source": meta.get("source", ""),
                    "text": doc[:500],
                    "score": round(1.0 - dist, 3)
                })
        return out
    except Exception as e:
        logger.error(f"Vector query error: {e}")
        return []
