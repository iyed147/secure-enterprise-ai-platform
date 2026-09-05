import re

_GREETING_PATTERNS = [
    r"^(bonjour|salut|hello|hi|hey|coucou)[\s!.,]*$",
    r"^(bonsoir)[\s!.,]*$",
]

_THANKS_PATTERNS = [
    r"^(merci|thanks|thank you|thx)[\s!.,]*$",
]

_FAREWELL_PATTERNS = [
    r"^(au revoir|bye|goodbye|à bientôt|a bientot)[\s!.,]*$",
]

_RESPONSES = {
    "greeting": "Bonjour ! Comment puis-je vous aider avec vos documents aujourd'hui ?",
    "thanks": "Avec plaisir ! N'hésitez pas si vous avez d'autres questions.",
    "farewell": "Au revoir ! À bientôt.",
}


def detect_small_talk(question: str) -> str | None:
    """
    Retourne une réponse directe si la question est une simple politesse
    (salutation, remerciement, au revoir), sans passer par le RAG.
    Retourne None si la question nécessite une vraie recherche documentaire.
    """
    q = question.strip().lower()

    if not q or len(q) > 40:  # une vraie question dépasse presque toujours cette longueur
        return None

    for pattern in _GREETING_PATTERNS:
        if re.match(pattern, q):
            return _RESPONSES["greeting"]

    for pattern in _THANKS_PATTERNS:
        if re.match(pattern, q):
            return _RESPONSES["thanks"]

    for pattern in _FAREWELL_PATTERNS:
        if re.match(pattern, q):
            return _RESPONSES["farewell"]

    return None