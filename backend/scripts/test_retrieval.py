"""
Test Step 4.1 : retrieval vectoriel filtré par utilisateur.
Usage : python scripts/test_retrieval.py "<question>" <user_id>
Exemple : python scripts/test_retrieval.py "What skills does this person have?" 8
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.services.retrieval import retrieve_relevant_chunks, format_chunks_with_sources


def main():
    if len(sys.argv) < 3:
        print('Usage: python scripts/test_retrieval.py "<question>" <user_id>')
        sys.exit(1)

    question = sys.argv[1]
    owner_user_id = int(sys.argv[2])

    db = SessionLocal()
    try:
        chunks = retrieve_relevant_chunks(question, owner_user_id, db, top_k=5)

        if not chunks:
            print(f"\n⚠️  Aucun chunk trouvé pour l'utilisateur id={owner_user_id}.\n")
            return

        results = format_chunks_with_sources(chunks, db)

        print(f"\n✅ {len(results)} chunks trouvés pour '{question}' (user_id: {owner_user_id})\n")

        for i, r in enumerate(results):
            print(f"--- Résultat {i+1} ---")
            print(f"Document: {r['document_title']} ({r['file_name']})")
            print(f"Page: {r['page']}")
            print(f"Contenu: {r['content'][:200]}...")
            print()

    finally:
        db.close()


if __name__ == "__main__":
    main()