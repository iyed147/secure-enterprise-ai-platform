"""
Script de test manuel pour le Step 3.4.
Usage : python scripts/test_chunking.py <chemin_vers_pdf>
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.document_processing import load_and_split_pdf


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_chunking.py <chemin_vers_pdf>")
        sys.exit(1)

    file_path = sys.argv[1]
    chunks = load_and_split_pdf(file_path)

    if len(chunks) == 0:
        print(f"\n⚠️  0 chunks générés depuis '{file_path}'")
        print("   Cause probable : PDF scanné/image sans texte sélectionnable (pas d'OCR dans ce projet).")
        print("   Ce document devrait être marqué status='failed' lors de l'ingestion réelle.\n")
        return

    print(f"\n✅ {len(chunks)} chunks générés depuis '{file_path}'\n")

    for i, chunk in enumerate(chunks[:5]):  # affiche les 5 premiers seulement
        print(f"--- Chunk {i} ---")
        print(f"Page: {chunk.metadata.get('page')}")
        print(f"Longueur: {len(chunk.page_content)} caractères")
        print(f"Contenu: {chunk.page_content[:200]}...")
        print()

    if len(chunks) > 5:
        print(f"... et {len(chunks) - 5} autres chunks non affichés.")


if __name__ == "__main__":
    main()