# Import all models so SQLAlchemy metadata is aware of them
from app.models import Role, User, Document, DocumentChunk  # noqa: F401