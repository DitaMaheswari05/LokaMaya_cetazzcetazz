import re
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

_classifier = None

TRANSIT_KEYWORDS = [
    "halte", "bus", "transjakarta", "tj", "jalan kaki", "trotoar", "pedestrian",
    "penyeberangan", "jpo", "zebra cross", "stasiun", "transit", "koridor",
    "angkutan", "mikrotrans", "angkot", "naik bus", "menunggu bus"
]

FACILITY_KEYWORDS = [
    "rusak", "sempit", "becek", "panas", "atap", "bocor", "antri", "penuh",
    "tidak ada lampu", "gelap", "lampu mati", "kotor", "bau", "kurang terawat"
]

class Classifier:
    def __init__(self, model_name: str, device: str):
        self.pipe = None
        self.model_name = model_name
        self.device = device
        self._load_pipeline()

    def _load_pipeline(self):
        try:
            from transformers import pipeline
            device_id = 0 if self.device == "cuda" else -1
            logger.info(f"Loading zero-shot pipeline with model {self.model_name}...")
            self.pipe = pipeline(
                "zero-shot-classification",
                model=self.model_name,
                device=device_id,
            )
            logger.info("Classifier pipeline loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load HuggingFace pipeline ({e}). Fallback to heuristic classifier.")
            self.pipe = None

    def classify(self, text: str, labels: list[str]) -> dict:
        """Klasifikasi teks aspirasi masyarakat terkait transit vs noise."""
        if settings.remote_ai_url:
            import httpx
            try:
                url = f"{settings.remote_ai_url.rstrip('/')}/classify"
                with httpx.Client(timeout=30.0) as client:
                    response = client.post(url, json={"text": text, "labels": labels})
                    response.raise_for_status()
                    return response.json()
            except Exception as e:
                logger.error(f"Error calling remote classifier at {settings.remote_ai_url}: {e}")

        if self.pipe is not None:
            try:
                result = self.pipe(text, candidate_labels=labels)
                return {
                    "label": result["labels"][0],
                    "confidence": round(float(result["scores"][0]), 4),
                }
            except Exception as e:
                logger.error(f"Inference error in HuggingFace pipeline: {e}. Using fallback.")

        # Heuristic fallback (fast, deterministic, resilient)
        lower_text = text.lower()
        has_transit = any(k in lower_text for k in TRANSIT_KEYWORDS)
        has_complaint = any(k in lower_text for k in FACILITY_KEYWORDS)

        if has_transit and has_complaint:
            label = "keluhan_fasilitas_halte" if "keluhan_fasilitas_halte" in labels else labels[0]
            confidence = 0.91
        elif has_transit:
            label = "aspirasi_transit_pejalan_kaki" if "aspirasi_transit_pejalan_kaki" in labels else labels[0]
            confidence = 0.88
        else:
            label = "noise_non_transit" if "noise_non_transit" in labels else (labels[-1] if labels else "noise")
            confidence = 0.85

        return {
            "label": label,
            "confidence": confidence,
        }

    def is_loaded(self) -> bool:
        return self.pipe is not None


def get_classifier() -> Classifier:
    """Singleton instance."""
    global _classifier
    if _classifier is None:
        _classifier = Classifier(settings.classification_model, settings.classification_device)
    return _classifier
