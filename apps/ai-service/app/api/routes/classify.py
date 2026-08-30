from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# Label default untuk klasifikasi Community Maps
# TODO: sesuaikan dengan kategori MAPID Community Maps yang aktual
DEFAULT_LABELS = [
    "perumahan",
    "komersial",
    "industri",
    "fasilitas_umum",
    "ruang_terbuka_hijau",
    "pendidikan",
    "kesehatan",
    "transportasi",
    "lainnya",
]


class ClassifyRequest(BaseModel):
    text: str
    labels: list[str] | None = None  # jika None, pakai DEFAULT_LABELS


class ClassifyResponse(BaseModel):
    label: str
    confidence: float


@router.post("", response_model=ClassifyResponse)
async def classify(request: ClassifyRequest) -> ClassifyResponse:
    """
    Klasifikasi teks Community Maps menggunakan IndoBERT.

    Dipanggil oleh Go API untuk menentukan kategori suatu lokasi/komunitas.

    TODO: implementasi dengan ml.classifier.Classifier
    """
    # TODO: implementasi
    # from app.ml.classifier import get_classifier
    # labels = request.labels or DEFAULT_LABELS
    # classifier = get_classifier()
    # result = classifier.classify(request.text, labels)
    # return ClassifyResponse(label=result["label"], confidence=result["confidence"])
    raise NotImplementedError("belum diimplementasi")
