import { Router } from "express";

import { HttpError } from "../errors";
import { fetchExchangeRates } from "../services/exchangeRateService";
import { normalizeCurrencyCode, parseCurrencyList } from "../utils/currency";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const baseParam =
      typeof req.query.base === "string" ? req.query.base : "USD";
    const base = normalizeCurrencyCode(baseParam);
    if (!base) {
      throw new HttpError(400, "Invalid base currency code");
    }

    const symbolsParam =
      typeof req.query.symbols === "string" ? req.query.symbols : undefined;
    const symbols = parseCurrencyList(symbolsParam);
    if (symbols === null) {
      throw new HttpError(400, "Invalid symbols list");
    }

    const { data, fromCache } = await fetchExchangeRates(base);
    const responseRates: Record<string, number> = {};
    const missingSymbols: string[] = [];

    if (symbols.length === 0) {
      Object.assign(responseRates, data.rates);
    } else {
      for (const symbol of symbols) {
        const rate = data.rates[symbol];
        if (rate === undefined) {
          missingSymbols.push(symbol);
        } else {
          responseRates[symbol] = rate;
        }
      }
    }

    res.json({
      base: data.base ?? base,
      date: data.date ?? null,
      lastUpdated: data.time_last_updated
        ? new Date(data.time_last_updated * 1000).toISOString()
        : null,
      rates: responseRates,
      missingSymbols,
      fromCache,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
