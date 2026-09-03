"""
Diagnostic rapide : le PDF contient-il du texte extractible ?
Usage : python scripts/diagnose_pdf.py <chemin_vers_pdf>
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pypdf import PdfReader


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/diagnose_pdf.py <chemin_vers_pdf>")
        sys.exit(1)

    file_path = sys.argv[1]
    reader = PdfReader(file_path)

    print(f"\n📄 {file_path}")
    print(f"Nombre de pages: {len(reader.pages)}\n")

    total_chars = 0
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        total_chars += len(text)
        print(f"Page {i}: {len(text)} caractères extraits")
        if text.strip():
            print(f"  Aperçu: {text[:100]!r}")
        else:
            print(f"  ⚠️  Vide — probablement une image (scan)")

    print(f"\nTotal: {total_chars} caractères sur tout le document")
    if total_chars == 0:
        print("❌ Confirmé : ce PDF ne contient aucun texte extractible (scan/image pure).")
    else:
        print("✅ Le PDF contient du texte — le problème vient d'ailleurs (à investiguer).")


if __name__ == "__main__":
    main()