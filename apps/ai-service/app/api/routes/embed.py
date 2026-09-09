from fastapi import APIRouter
from pydantic import BaseModel
from app.ml.embedder import get_embedder

router = APIRouter()


class EmbedRequest(BaseModel):
    texts: list[str]


class EmbedResponse(BaseModel):
    embeddings: list[list[float]]


@router.post("", response_model=EmbedResponse)
async def embed(request: EmbedRequest) -> EmbedResponse:
    """
    Generate embedding vektor untuk satu atau lebih teks menggunakan BGE-M3 (1024-dimensi).
    Dipakai oleh Go API untuk RAG dokumen regulasi tata ruang dan pencarian semantik via pgvector.
    """
    embedder = get_embedder()
    embeddings = embedder.encode(request.texts)
    return EmbedResponse(embeddings=embeddings.tolist())
