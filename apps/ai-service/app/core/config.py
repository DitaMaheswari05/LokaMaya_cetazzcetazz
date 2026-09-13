from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Model embedding (BGE-M3)
    embedding_model: str = "BAAI/bge-m3"
    embedding_device: str = "cpu"  # "cuda" jika ada GPU

    # Model klasifikasi (IndoBERT)
    # TODO: tentukan model IndoBERT yang dipakai (fine-tuned atau zero-shot)
    classification_model: str = "indobenchmark/indobert-base-p1"
    classification_device: str = "cpu"

    # Server
    host: str = "0.0.0.0"
    port: int = 8001
    
    # Proxy Configuration for Vercel
    remote_ai_url: str | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
