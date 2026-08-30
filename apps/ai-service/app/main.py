from fastapi import FastAPI
from app.api.routes import embed, classify

app = FastAPI(
    title="LokaMaya AI Service",
    description="Python microservice untuk inference IndoBERT (klasifikasi) dan BGE-M3 (embedding).",
    version="1.0.0",
)

app.include_router(embed.router, prefix="/embed", tags=["embedding"])
app.include_router(classify.router, prefix="/classify", tags=["classification"])


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "lokamaya-ai-service",
        # TODO: tambahkan "models_loaded": embedder.is_loaded() and classifier.is_loaded()
    }
