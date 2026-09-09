import logging
import numpy as np
from app.core.config import settings

logger = logging.getLogger(__name__)

_embedder = None


class Embedder:
    def __init__(self, model_name: str, device: str):
        self.model = None
        self.model_name = model_name
        self.device = device
        self._load_model()

    def _load_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading SentenceTransformer embedding model: {self.model_name}...")
            self.model = SentenceTransformer(self.model_name, device=self.device)
            logger.info("SentenceTransformer model loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer ({e}). Fallback to deterministic pseudo-embedding.")
            self.model = None

    def encode(self, texts: list[str]) -> np.ndarray:
        """Encode teks menjadi vector embedding float32 (1024-dimensi untuk BGE-M3)."""
        if self.model is not None:
            try:
                embeddings = self.model.encode(texts, normalize_embeddings=True)
                return np.array(embeddings, dtype=np.float32)
            except Exception as e:
                logger.error(f"Inference error in SentenceTransformer: {e}. Using fallback.")

        # Fallback pseudo-embedding deterministik (1024-dimensi) berbasis hash teks
        embeddings = []
        for text in texts:
            np.random.seed(abs(hash(text)) % (2**32))
            vec = np.random.randn(1024).astype(np.float32)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            embeddings.append(vec)
        return np.array(embeddings, dtype=np.float32)

    def is_loaded(self) -> bool:
        return self.model is not None


def get_embedder() -> Embedder:
    """Singleton pattern — model di-load satu kali."""
    global _embedder
    if _embedder is None:
        _embedder = Embedder(settings.embedding_model, settings.embedding_device)
    return _embedder
