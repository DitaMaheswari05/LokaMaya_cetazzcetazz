from fastapi import APIRouter
from pydantic import BaseModel
from app.ml.classifier import get_classifier

router = APIRouter()

# Label default sesuai PRD LokaMaya: menyaring aspirasi warga terkait transit/pejalan kaki dari noise
DEFAULT_LABELS = [
    "aspirasi_transit_pejalan_kaki",
    "keluhan_fasilitas_halte",
    "noise_non_transit",
]


class ClassifyRequest(BaseModel):
    text: str
    labels: list[str] | None = None


class ClassifyResponse(BaseModel):
    label: str
    confidence: float


@router.post("", response_model=ClassifyResponse)
async def classify(request: ClassifyRequest) -> ClassifyResponse:
    """
    Klasifikasi teks aspirasi Community Maps menggunakan IndoBERT (Zero-Shot).
    Menentukan apakah postingan merupakan aspirasi transit/halte atau sekadar noise.
    """
    labels = request.labels or DEFAULT_LABELS
    classifier = get_classifier()
    result = classifier.classify(request.text, labels)
    return ClassifyResponse(label=result["label"], confidence=result["confidence"])
