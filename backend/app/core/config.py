from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Secure Enterprise AI API"
    app_env: str = "development"
    app_debug: bool = True
    app_host: str = "127.0.0.1"
    app_port: int = 8000

    database_url: str

    secret_key: str = "change-me-in-env"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # LangChain / Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_llm_model: str = "llama3.1:8b"
    ollama_embedding_model: str = "nomic-embed-text"
    embedding_dimension: int = 768

    # Document ingestion
    upload_dir: str = "uploaded_documents"
    chunk_size: int = 1000
    chunk_overlap: int = 150

    # Face recognition (NEW)
    face_embedding_dimension: int = 128  # Facenet produit des vecteurs de 128
    face_match_threshold: float = 10.0   # à calibrer empiriquement au Step 5.4


settings = Settings()