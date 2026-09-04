# TODO: implementasi BGE-M3 embedder sebagai singleton agar model hanya di-load sekali

# from sentence_transformers import SentenceTransformer
# from app.core.config import settings
# import numpy as np

# _embedder: SentenceTransformer | None = None


# class Embedder:
#     def __init__(self, model_name: str, device: str):
#         self.model = SentenceTransformer(model_name, device=device)

#     def encode(self, texts: list[str]) -> np.ndarray:
#         """Encode teks menjadi vector embedding float32."""
#         return self.model.encode(texts, normalize_embeddings=True)

#     def is_loaded(self) -> bool:
#         return self.model is not None


# def get_embedder() -> Embedder:
#     """Singleton pattern — model hanya di-load satu kali saat aplikasi start."""
#     global _embedder
#     if _embedder is None:
#         _embedder = Embedder(settings.embedding_model, settings.embedding_device)
#     return _embedder
