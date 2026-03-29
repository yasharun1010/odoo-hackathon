const CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;

export function normalizeCurrencyCode(code: string): string | null {
  const trimmed = code.trim().toUpperCase();
  if (!CURRENCY_CODE_REGEX.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function parseCurrencyList(raw: string | undefined): string[] | null {
  if (!raw) {
    return [];
  }

  const parts = raw.split(",").map((part) => part.trim());
  if (parts.length === 0 || parts.every((part) => part.length === 0)) {
    return null;
  }

  const codes: string[] = [];
  for (const part of parts) {
    if (!part) {
      return null;
    }
    const normalized = normalizeCurrencyCode(part);
    if (!normalized) {
      return null;
    }
    if (!codes.includes(normalized)) {
      codes.push(normalized);
    }
  }

  return codes;
}
