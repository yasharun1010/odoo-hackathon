import axios from "axios";

import { HttpError } from "../errors";

type ExchangeRateApiResponse = {
  base: string;
  rates: Record<string, number>;
  time_last_updated?: number;
  date?: string;
};

type CachedEntry = {
  fetchedAt: number;
  data: ExchangeRateApiResponse;
};

const DEFAULT_TTL_MS = 10 * 60 * 1000;
const CACHE = new Map<string, CachedEntry>();

function getCacheTtl(): number {
  const rawTtl = process.env.EXCHANGE_RATE_CACHE_TTL_MS;
  if (!rawTtl) {
    return DEFAULT_TTL_MS;
  }

  const parsed = Number(rawTtl);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_TTL_MS;
  }
  return parsed;
}

export async function fetchExchangeRates(base: string): Promise<{
  data: ExchangeRateApiResponse;
  fromCache: boolean;
}> {
  const cached = CACHE.get(base);
  const ttl = getCacheTtl();
  if (cached && Date.now() - cached.fetchedAt < ttl) {
    return { data: cached.data, fromCache: true };
  }

  const baseUrl =
    process.env.EXCHANGE_RATE_BASE_URL ??
    "https://api.exchangerate-api.com/v4/latest";
  const url = `${baseUrl}/${base}`;

  try {
    const response = await axios.get<ExchangeRateApiResponse>(url, {
      timeout: 8000,
    });

    if (!response.data || !response.data.rates) {
      throw new Error("Invalid exchange rate response");
    }

    CACHE.set(base, { fetchedAt: Date.now(), data: response.data });
    return { data: response.data, fromCache: false };
  } catch (error) {
    throw new HttpError(502, "Failed to fetch exchange rates");
  }
}
