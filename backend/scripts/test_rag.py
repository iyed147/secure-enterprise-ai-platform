"""
Test Step 4.2 : pipeline RAG complet (retrieval + génération), avec scoping optionnel.
Usage : python scripts/test_rag.py "<question>" <user_id> [doc_id1,doc_id2,...]
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.services.retrieval import (
    retrieve_relevant_chunks,
    format_chunks_with_sources,
    verify_documents_ownership,
)
from app.services.generation import generate_answer


def main():
    if len(sys.argv) < 3:
        print('Usage: python scripts/test_rag.py "<question>" <user_id> [doc_id1,doc_id2,...]')
        sys.exit(1)

    question = sys.argv[1]
    owner_user_id = int(sys.argv[2])

    document_ids = None
    if len(sys.argv) > 3:
        document_ids = [int(x) for x in sys.argv[3].split(",")]

    db = SessionLocal()
    try:
        if document_ids:
            if not verify_documents_ownership(document_ids, owner_user_id, db):
                print("\n❌ Un ou plusieurs document_ids ne t'appartiennent pas. Requête refusée.\n")
                return
            print(f"\n🎯 Recherche restreinte aux documents: {document_ids}")

        chunks = retrieve_relevant_chunks(question, owner_user_id, db, top_k=5, document_ids=document_ids)
        results = format_chunks_with_sources(chunks, db)

        if not results:
            print(f"\n⚠️  Aucun document trouvé.")
            print("Réponse attendue du système : impossibilité de répondre.\n")

        print(f"\n🔎 {len(results)} chunks utilisés comme contexte\n")
        answer = generate_answer(question, results)

        print("=" * 60)
        print("RÉPONSE GÉNÉRÉE :")
        print("=" * 60)
        print(answer)
        print()
        print("SOURCES :")
        for r in results:
            print(f"  - {r['document_title']} — Page {r['page']}")

    finally:
        db.close()


if __name__ == "__main__":
    main()