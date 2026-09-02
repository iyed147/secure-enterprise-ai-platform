"""
Script de test manuel pour le Step 3.5.
Usage : python scripts/test_embeddings.py <chemin_vers_pdf>
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.services.document_processing import load_and_split_pdf
from app.services.embeddings import embed_texts


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_embeddings.py <chemin_vers_pdf>")
        sys.exit(1)

    file_path = sys.argv[1]
    chunks = load_and_split_pdf(file_path)

    if len(chunks) == 0:
        print(f"\n⚠️  0 chunks générés depuis '{file_path}' — rien à embedder.\n")
        return

    print(f"\n📄 {len(chunks)} chunks à embedder...")

    texts = [c.page_content for c in chunks]
    vectors = embed_texts(texts)

    print(f"\n✅ {len(vectors)} embeddings générés\n")

    expected_dim = settings.embedding_dimension
    for i, vec in enumerate(vectors):
        actual_dim = len(vec)
        status = "OK" if actual_dim == expected_dim else "❌ MISMATCH"
        print(f"Chunk {i}: dimension={actual_dim} (attendu={expected_dim}) [{status}]")
        print(f"  Premiers valeurs: {vec[:5]}")
        print()


if __name__ == "__main__":
    main()