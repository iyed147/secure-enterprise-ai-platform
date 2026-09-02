from langchain_ollama import OllamaEmbeddings

from app.core.config import settings

_embeddings_client: OllamaEmbeddings | None = None


def get_embeddings_client() -> OllamaEmbeddings:
    """
    Singleton simple pour éviter de recréer le client à chaque appel.
    """
    global _embeddings_client
    if _embeddings_client is None:
        _embeddings_client = OllamaEmbeddings(
            model=settings.ollama_embedding_model,
            base_url=settings.ollama_base_url,
        )
    return _embeddings_client


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Génère les embeddings pour une liste de textes (batch).
    Retourne une liste de vecteurs, un par texte, dans le même ordre.
    """
    if not texts:
        return []

    client = get_embeddings_client()
    vectors = client.embed_documents(texts)
    return vectors


def embed_query(text: str) -> list[float]:
    """
    Génère l'embedding pour une seule requête (utilisé plus tard au Step 4, RAG retrieval).
    """
    client = get_embeddings_client()
    return client.embed_query(text)