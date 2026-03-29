import re

_CODE_RE = re.compile(r"^[A-Z]{3}$")


def normalize_currency(code: str) -> str | None:
    if not code:
        return None
    normalized = code.strip().upper()
    if not _CODE_RE.match(normalized):
        return None
    return normalized


def parse_symbol_list(raw: str | None) -> list[str] | None:
    if raw is None or raw == "":
        return []
    parts = [part.strip() for part in raw.split(",")]
    if any(part == "" for part in parts):
        return None
    codes: list[str] = []
    for part in parts:
        normalized = normalize_currency(part)
        if not normalized:
            return None
        if normalized not in codes:
            codes.append(normalized)
    return codes
