"""
Test Step 3.6 : pipeline complet upload → chunks → embeddings → DB
Usage : python scripts/test_ingestion.py <chemin_vers_pdf>
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.document import Document
from app.services.ingestion import ingest_document


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_ingestion.py <chemin_vers_pdf>")
        sys.exit(1)

    file_path = sys.argv[1]

    db = SessionLocal()
    try:
        # Créer un doc temporaire en DB pour tester
        doc = Document(
            title="Test ingestion",
            file_name=os.path.basename(file_path),
            owner_role="developer",
            allowed_roles=["developer"],
            status="uploaded",
        )
        # On pointe sur le fichier existant directement
        # (override upload_dir pour le test)
        import app.services.ingestion as ing_module
        original = ing_module.ingest_document

        def patched_ingest(document, db):
            import app.services.document_processing as dp
            import app.services.embeddings as emb
            from app.models.chunk import DocumentChunk

            chunks = dp.load_and_split_pdf(file_path)
            if not chunks:
                document.status = "failed"
                db.add(document)
                db.commit()
                return 0

            texts = [c.page_content for c in chunks]
            vectors = emb.embed_texts(texts)

            for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
                db_chunk = DocumentChunk(
                    document_id=document.id,
                    chunk_index=i,
                    page=chunk.metadata.get("page", 0),
                    content=chunk.page_content,
                    embedding=vector,
                    allowed_roles=document.allowed_roles,
                )
                db.add(db_chunk)

            document.status = "processed"
            db.add(document)
            db.commit()
            return len(chunks)

        db.add(doc)
        db.commit()
        db.refresh(doc)

        print(f"\n📄 Document créé en DB (id={doc.id}), lancement ingestion...")
        count = patched_ingest(doc, db)
        db.refresh(doc)

        print(f"✅ {count} chunks insérés")
        print(f"   status: {doc.status}")

        # Vérif rapide
        from sqlalchemy import select
        from app.models.chunk import DocumentChunk
        chunks_in_db = db.scalars(
            select(DocumentChunk).where(DocumentChunk.document_id == doc.id)
        ).all()
        print(f"   chunks en DB: {len(chunks_in_db)}")
        if chunks_in_db:
            c = chunks_in_db[0]
            print(f"   chunk 0 — page={c.page}, dim={len(c.embedding)}, roles={c.allowed_roles}")

    finally:
        db.close()


if __name__ == "__main__":
    main()