"""Reglas de normalización, filtrado y ordenamiento de obras para el tour."""

import json
import re
import unicodedata
from dataclasses import dataclass

# Minutos que se suman al cambiar de sala durante el recorrido.
ROOM_TRANSITION_MINUTES = 5

ROOM_ORDER = {
    "sala_1_grandes_maestros": 1,
    "sala_2_impresionismo": 2,
    "sala_3_vanguardias": 3,
    "sala_4_arte_moderno": 4,
}

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

TECHNIQUE_ALIASES = {
    "oleo": "oleo",
    "pintura al oleo": "oleo",
    "acrilico": "acrilico",
    "pintura acrilica": "acrilico",
    "acuarela": "acuarela",
    "temple": "temple",
    "escultura": "escultura",
    "fotografia": "fotografia",
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


@dataclass(frozen=True)
class WorkCandidate:
    """Obra normalizada que usa el planificador para evaluar y ordenar el tour."""

    id: int
    title: str
    artist_id: int
    artist_name: str
    image_url: str
    creation_year: int
    technique: str
    dimensions: str
    era: str
    topic: str
    topics: tuple[str, ...]
    description: str
    location: str
    availability: str
    estimated_duration_minutes: int


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


def canonical_technique(value) -> str:
    """Normaliza una técnica y la resuelve a su alias canónico."""
    normalized = normalize_text(value)
    return TECHNIQUE_ALIASES.get(normalized, normalized)


def canonical_location(value) -> str:
    """Normaliza una sala y la resuelve a su identificador canónico."""
    normalized = normalize_text(value)
    alias = LOCATION_ALIASES.get(normalized)
    if alias is not None:
        return alias
    return normalized.replace(" ", "_")


def parse_topics(raw) -> tuple[str, ...]:
    """Convierte topics en una tupla normalizada y sin duplicados.

    Acepta listas, JSON de listas o texto separado por coma, punto y coma o ``|``.
    """
    if raw is None:
        return ()

    if isinstance(raw, (list, tuple, set)):
        values = [normalize_text(item) for item in raw]
        return tuple(dict.fromkeys(value for value in values if value))

    text = str(raw).strip()
    if not text:
        return ()

    if text.startswith("["):
        try:
            decoded = json.loads(text)
        except (TypeError, ValueError):
            decoded = None
        if isinstance(decoded, list):
            values = [normalize_text(item) for item in decoded]
            return tuple(dict.fromkeys(value for value in values if value))

    values = [normalize_text(part) for part in re.split(r"[,;|]", text)]
    return tuple(dict.fromkeys(value for value in values if value))


def is_exhibited(work: WorkCandidate) -> bool:
    """Indica si la obra está disponible para exhibición."""
    return normalize_text(work.availability) == "en exhibicion"


def room_rank(location: str) -> tuple[int, str]:
    """Devuelve el orden de la sala y su nombre canónico."""
    canonical = canonical_location(location)
    return ROOM_ORDER.get(canonical, 99), canonical


def relevance_score(
    work: WorkCandidate,
    topic_filters: set[str],
    era_filters: set[str],
    technique_filters: set[str],
) -> int:
    """Calcula la prioridad de una obra según los filtros activos.

    Cada topic coincide con 3 puntos; era y técnica suman 2 puntos cada una.
    """
    topic_matches = len(set(work.topics).intersection(topic_filters))
    era_match = 1 if canonical_era(work.era) in era_filters else 0
    technique_match = 1 if canonical_technique(work.technique) in technique_filters else 0
    return topic_matches * 3 + era_match * 2 + technique_match * 2


def matches_filters(
    work: WorkCandidate,
    topic_filters: set[str],
    era_filters: set[str],
    technique_filters: set[str],
) -> bool:
    """Comprueba si la obra cumple al menos un valor de cada filtro activo."""
    if topic_filters and not set(work.topics).intersection(topic_filters):
        return False
    if era_filters and canonical_era(work.era) not in era_filters:
        return False
    if technique_filters and canonical_technique(work.technique) not in technique_filters:
        return False
    return True


def order_tour(works: list[WorkCandidate]) -> list[WorkCandidate]:
    """Ordena el tour por sala, año de creación e id."""
    return sorted(
        works,
        key=lambda work: (
            room_rank(work.location),
            work.creation_year if work.creation_year > 0 else 9999,
            work.id,
        ),
    )


def calculate_total_duration(
    works: list[WorkCandidate],
    transition_minutes: int = ROOM_TRANSITION_MINUTES,
) -> int:
    """Suma la duración de las obras y los traslados entre salas distintas."""
    if not works:
        return 0

    rooms = {canonical_location(work.location) for work in works}
    works_duration = sum(max(0, int(work.estimated_duration_minutes)) for work in works)
    transitions = max(0, len(rooms) - 1) * max(0, transition_minutes)
    return works_duration + transitions


def plan_tour(
    works: list[WorkCandidate],
    topics=(),
    eras=(),
    techniques=(),
    max_duration_minutes: int = 0,
    max_works_count: int = 0,
    transition_minutes: int = ROOM_TRANSITION_MINUTES,
) -> list[WorkCandidate]:
    """Selecciona obras para el tour y las devuelve en orden de visita.

    Aplica los filtros, prioriza coincidencias y respeta los límites de duración
    y cantidad. Los límites en cero significan sin restricción.
    """
    topic_filters = {normalize_text(topic) for topic in topics if normalize_text(topic)}
    era_filters = {canonical_era(era) for era in eras if normalize_text(era)}
    technique_filters = {
        canonical_technique(technique) for technique in techniques if normalize_text(technique)
    }

    candidates = [
        work
        for work in works
        if is_exhibited(work)
        and matches_filters(work, topic_filters, era_filters, technique_filters)
    ]

    candidates.sort(
        key=lambda work: (
            -relevance_score(work, topic_filters, era_filters, technique_filters),
            max(0, int(work.estimated_duration_minutes)),
            work.id,
        )
    )

    selected: list[WorkCandidate] = []
    selected_rooms: set[str] = set()
    total_duration = 0

    for work in candidates:
        if max_works_count > 0 and len(selected) >= max_works_count:
            break

        duration = max(0, int(work.estimated_duration_minutes))
        room = canonical_location(work.location)
        adds_room = room not in selected_rooms
        cost = duration
        if selected_rooms and adds_room:
            cost += max(0, transition_minutes)

        if max_duration_minutes > 0 and total_duration + cost > max_duration_minutes:
            continue

        selected.append(work)
        selected_rooms.add(room)
        total_duration += cost

    return order_tour(selected)
