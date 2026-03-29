from __future__ import annotations

import time
from dataclasses import dataclass

import requests


@dataclass
class CachedRates:
    fetched_at: float
    data: dict


_CACHE: dict[str, CachedRates] = {}


def get_rates(base: str, base_url: str, ttl_seconds: int) -> tuple[dict, bool]:
    now = time.time()
    cached = _CACHE.get(base)
    if cached and now - cached.fetched_at < ttl_seconds:
        return cached.data, True

    response = requests.get(f"{base_url}/{base}", timeout=8)
    response.raise_for_status()
    data = response.json()
    if "rates" not in data:
        raise ValueError("Invalid exchange rate response")

    _CACHE[base] = CachedRates(fetched_at=now, data=data)
    return data, False
