# TODO: implementasi IndoBERT classifier sebagai singleton

# from transformers import pipeline
# from app.core.config import settings

# _classifier = None


# class Classifier:
#     def __init__(self, model_name: str, device: str):
#         # Zero-shot classification pipeline — tidak butuh fine-tuning khusus
#         self.pipe = pipeline(
#             "zero-shot-classification",
#             model=model_name,
#             device=0 if device == "cuda" else -1,
#         )

#     def classify(self, text: str, labels: list[str]) -> dict:
#         """Klasifikasi teks ke salah satu label yang diberikan."""
#         result = self.pipe(text, candidate_labels=labels)
#         return {
#             "label": result["labels"][0],
#             "confidence": float(result["scores"][0]),
#         }

#     def is_loaded(self) -> bool:
#         return self.pipe is not None


# def get_classifier() -> Classifier:
#     """Singleton pattern — model hanya di-load satu kali."""
#     global _classifier
#     if _classifier is None:
#         _classifier = Classifier(settings.classification_model, settings.classification_device)
#     return _classifier
