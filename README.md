# Vaultmind — Secure Enterprise AI Knowledge Platform

Une plateforme d'entreprise combinant **authentification biométrique**, **sécurité par conception** et **intelligence artificielle générative (RAG)** pour donner à chaque employé un accès sécurisé, personnalisé et sourcé aux connaissances de son organisation.

![Python](https://img.shields.io/badge/backend-FastAPI-009688)
![React](https://img.shields.io/badge/frontend-React%20%2B%20TypeScript-61DAFB)
![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL%20%2B%20pgvector-336791)

---

## Objectif

Donner à des employés d'entreprise un assistant IA capable de répondre à partir des documents internes, sans jamais qu'un employé puisse accéder à une information qui ne lui est pas destinée.

Chaque employé :
1. S'identifie (mot de passe **ou** reconnaissance faciale)
2. Importe ses propres documents (strictement privés, jamais partagés entre comptes)
3. Pose des questions en langage naturel
4. Reçoit une réponse **sourcée**, construite uniquement à partir de ses documents — jamais inventée, jamais issue d'un autre compte

Le projet combine : **Software Engineering + Security + Computer Vision + Generative AI**.

---

Chaque employé :
1. S'identifie de manière sécurisée (mot de passe **ou** reconnaissance faciale)
2. Importe ses propres documents (strictement privés, jamais partagés entre comptes)
3. Pose des questions en langage naturel à un assistant IA
4. Reçoit une réponse **sourcée**, construite uniquement à partir de ses documents autorisés — jamais inventée, jamais issue d'un autre compte

---

## ✅ Ce que le projet démontre

- Une architecture **Full-Stack** complète (React/TypeScript ↔ FastAPI ↔ PostgreSQL)
- Un pipeline **RAG** de bout en bout : ingestion PDF → chunking → embeddings → recherche vectorielle → génération de réponse
- Une **isolation stricte des données par utilisateur**, vérifiée par des tests croisés multi-comptes
- Une authentification biométrique réelle (**MediaPipe + DeepFace/Facenet**), pas un placeholder
- Une architecture LLM **interchangeable** (local via Ollama ↔ cloud via Groq) sans changement de code métier
- Une attention portée à la **lutte contre les hallucinations** (prompt engineering itératif, tests de confusion inter-documents, réponses partielles nuancées)

---

## Architecture


React + TypeScript + Tailwind
            │
            ▼
       FastAPI (Python)
   ┌────────┼─────────┐
   │        │         │
  Auth   Documents   Chat (RAG)
   │        │         │
 JWT +  MediaPipe +  LangChain
 bcrypt  DeepFace    (chunking → embeddings → retrieval)
                          │
                          ▼
              PostgreSQL + pgvector
              (isolé par owner_user_id)
                          │
                          ▼
            LLM — Ollama local ou Groq cloud
                          │
                          ▼
              Réponse sourcée (streaming)



---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS v4 |
| Backend | FastAPI (Python) |
| Base de données | PostgreSQL + pgvector |
| ORM / Migrations | SQLAlchemy + Alembic |
| Sécurité | bcrypt + JWT (python-jose) |
| RAG | LangChain, Ollama (embeddings), Ollama/Groq (LLM) |
| Vision par ordinateur | MediaPipe (détection) + DeepFace/Facenet (embedding facial) |

---

## Points forts

**Sécurité** — Isolation stricte par compte (`owner_user_id`), filtrée en base *avant* la recherche vectorielle, jamais déléguée au LLM. Vérifiée par tests croisés entre comptes.

**RAG** — Pipeline complet PDF → chunks → embeddings → recherche vectorielle → génération. Retrieval équilibré sur les comparaisons multi-documents, prompt anti-hallucination testé et durci, mémoire conversationnelle, réponses en streaming, LLM interchangeable local/cloud sans changement de code.

**Computer Vision** — Reconnaissance faciale réelle (pas un placeholder) : détection MediaPipe + embedding Facenet (128D) + comparaison par distance. Choix architectural volontaire d'éviter une classification (RF/KNN), inadaptée à un problème ouvert où chaque nouvel utilisateur est une nouvelle identité.

**Développement logiciel** — Progression incrémentale, chaque brique testée isolément avant intégration, design system Tailwind cohérent, gestion d'erreurs explicite.

---

## Installation

### Prérequis
- Python 3.11+, Node.js 18+, Docker, [Ollama](https://ollama.com)
- Un compte [Groq](https://console.groq.com) (gratuit) pour le LLM cloud, optionnel

### 1. Cloner le projet

```bash
git clone https://github.com/iyed147/secure-enterprise-ai-platform.git
cd secure-enterprise-ai-platform
```

### 2. Démarrer PostgreSQL

```bash
docker run -d --name sea_postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=secure_enterprise_ai -p 5433:5432 \
  pgvector/pgvector:pg16
```

### 3. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env        # puis renseigner DATABASE_URL et SECRET_KEY

alembic upgrade head

ollama pull nomic-embed-text
ollama pull llama3.1:8b       # optionnel si usage Groq uniquement

uvicorn app.main:app --reload
```

API disponible sur `http://127.0.0.1:8000` (docs sur `/docs`).

### 4. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Application disponible sur `http://localhost:5173`.

---

## Variables d'environnement principales

**Backend** — `DATABASE_URL`, `SECRET_KEY`, `LLM_PROVIDER` (`local`/`cloud`), `GROQ_API_KEY` (si cloud), `OLLAMA_LLM_MODEL`, `FACE_MATCH_THRESHOLD`.

**Frontend** — `VITE_API_BASE_URL`.

---

## Limites connues

- Pas d'OCR : les PDFs scannés (sans texte sélectionnable) sont marqués `failed`
- Mémoire de conversation côté frontend uniquement (pas de persistance multi-session)
- Seuil de reconnaissance faciale calibré empiriquement, sur un nombre limité de cas

---

## Auteur

**Iyed Ben Romdhane** — [LinkedIn](#) · [GitHub](https://github.com/iyed147)