from fastapi import FastAPI
from app.api.routes import embed, classify
from app.ml.classifier import get_classifier
from app.ml.embedder import get_embedder

app = FastAPI(
    title="LokaMaya AI Service",
    description="Python microservice untuk inference IndoBERT (klasifikasi Community Maps) dan BGE-M3 (embedding regulasi).",
    version="1.0.0",
)

app.include_router(embed.router, prefix="/embed", tags=["embedding"])
app.include_router(classify.router, prefix="/classify", tags=["classification"])


@app.get("/health")
def health_check():
    classifier = get_classifier()
    embedder = get_embedder()
    return {
        "status": "ok",
        "service": "lokamaya-ai-service",
        "classifier_loaded": classifier.is_loaded(),
        "embedder_loaded": embedder.is_loaded(),
    }
