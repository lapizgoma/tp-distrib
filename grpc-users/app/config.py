"""Carga las variables de un archivo .env local, si existe."""

import os
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parent.parent
_loaded = False


def _parse_line(raw_line: str) -> tuple[str, str] | None:
    """Convierte una línea ``KEY=VALUE`` en ``(key, value)``.

    Devuelve ``None`` para líneas vacías, comentarios o formato inválido.
    """
    line = raw_line.strip()
    if not line or line.startswith("#"):
        return None

    if line.startswith("export "):
        line = line[len("export ") :].lstrip()

    key, separator, value = line.partition("=")
    key = key.strip()
    if not separator or not key:
        return None

    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        value = value[1:-1]

    return key, value


def load_env(path: str | Path | None = None) -> None:
    """Carga el .env indicado sin sobrescribir variables ya definidas.

    Por defecto usa el .env de la raíz del servicio y solo lo procesa una vez
    por proceso.
    """
    global _loaded
    if _loaded:
        return

    env_path = Path(path) if path is not None else SERVICE_ROOT / ".env"
    if env_path.is_file():
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            parsed = _parse_line(raw_line)
            if parsed is None:
                continue
            key, value = parsed
            os.environ.setdefault(key, value)

    _loaded = True
