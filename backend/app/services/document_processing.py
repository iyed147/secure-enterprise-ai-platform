from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document as LangchainDocument

from app.core.config import settings


def load_and_split_pdf(file_path: str) -> list[LangchainDocument]:
    """
    Charge un PDF et le découpe en chunks.
    Chaque chunk conserve les métadonnées de page via LangChain.
    """
    loader = PyPDFLoader(file_path)
    pages = loader.load()  # 1 Document LangChain par page, avec metadata["page"]

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = splitter.split_documents(pages)
    return chunks