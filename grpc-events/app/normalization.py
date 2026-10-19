"""Normalización de eras y salas para comparar datos de eventos."""

import re
import unicodedata

ERA_ALIASES = {
    "renacimiento": "renacimiento",
    "barroco": "barroco",
    "impresionismo": "impresionismo",
    "vanguardia": "vanguardia",
    "vanguardias": "vanguardia",
    "contemporaneo": "contemporaneo",
    "contemporanea": "contemporaneo",
    "arte contemporaneo": "contemporaneo",
}

LOCATION_ALIASES = {
    "sala 1 grandes maestros": "sala_1_grandes_maestros",
    "grandes maestros": "sala_1_grandes_maestros",
    "sala 2 impresionismo": "sala_2_impresionismo",
    "impresionismo": "sala_2_impresionismo",
    "sala 3 vanguardias": "sala_3_vanguardias",
    "vanguardias": "sala_3_vanguardias",
    "sala 4 arte moderno": "sala_4_arte_moderno",
    "arte moderno": "sala_4_arte_moderno",
    "deposito": "deposito",
}


def normalize_text(value) -> str:
    """Pasa un texto a minúsculas, sin acentos y con espacios simples."""
    if value is None:
        return ""
    text = unicodedata.normalize("NFKD", str(value))
    text = "".join(character for character in text if not unicodedata.combining(character))
    text = text.replace("_", " ").replace("-", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip().lower()


def canonical_era(value) -> str:
    """Normaliza una era y la resuelve a su alias canónico."""
    normalized = normalize_text(value)
    return ERA_ALIASES.get(normalized, normalized)


def canonical_location(value) -> str:
    """Normaliza una sala y la resuelve a su identificador canónico."""
    normalized = normalize_text(value)
    alias = LOCATION_ALIASES.get(normalized)
    if alias is not None:
        return alias
    return normalized.replace(" ", "_")
