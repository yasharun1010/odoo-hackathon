from flask import Blueprint, current_app, jsonify, request

from ..services.exchange_rates import get_rates
from ..utils.currency import normalize_currency, parse_symbol_list

exchange_rate_bp = Blueprint(
    "exchange_rate", __name__, url_prefix="/api/exchange-rate"
)


@exchange_rate_bp.get("")
def exchange_rate():
    base_param = request.args.get("base", "USD")
    base = normalize_currency(base_param)
    if not base:
        return jsonify({"error": "Invalid base currency"}), 400

    symbols_param = request.args.get("symbols")
    symbols = parse_symbol_list(symbols_param)
    if symbols is None:
        return jsonify({"error": "Invalid symbols list"}), 400

    data, from_cache = get_rates(
        base,
        current_app.config["EXCHANGE_RATE_BASE_URL"],
        current_app.config["EXCHANGE_RATE_CACHE_TTL_SECONDS"],
    )
    rates = data.get("rates", {})
    response_rates = {}
    missing = []

    if not symbols:
        response_rates = rates
    else:
        for symbol in symbols:
            if symbol not in rates:
                missing.append(symbol)
            else:
                response_rates[symbol] = rates[symbol]

    return jsonify(
        {
            "base": data.get("base", base),
            "date": data.get("date"),
            "last_updated": data.get("time_last_updated"),
            "rates": response_rates,
            "missing_symbols": missing,
            "from_cache": from_cache,
        }
    )
