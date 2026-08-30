from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class EmbedRequest(BaseModel):
    texts: list[str]


class EmbedResponse(BaseModel):
    embeddings: list[list[float]]


@router.post("", response_model=EmbedResponse)
async def embed(request: EmbedRequest) -> EmbedResponse:
    """
    Generate embedding vektor untuk satu atau lebih teks menggunakan BGE-M3.

    Dipanggil oleh Go API untuk RAG: teks query regulasi → vector → pgvector search.

    TODO: implementasi dengan ml.embedder.Embedder
    """
    # TODO: implementasi
    # from app.ml.embedder import get_embedder
    # embedder = get_embedder()
    # embeddings = embedder.encode(request.texts)
    # return EmbedResponse(embeddings=embeddings.tolist())
    raise NotImplementedError("belum diimplementasi")
