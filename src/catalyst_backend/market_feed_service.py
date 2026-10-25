"""Live Market Price & Multi-Category News Feed Service.

Ingests market prices and real-time headlines from Polygon.io on the backend,
while exposing clean, human-readable domain models (`Live Market Price`,
`Market News Sentiment`, `Bullish` / `Bearish`) with zero backend data-provider
jargon in user-facing labels.
"""

from __future__ import annotations

import time
from typing import Literal

import httpx

from .config import get_polygon_api_key
from .domain_models import MarketNewsArticle, SentimentLabel
from .platform_registry import AssetClass, auto_select_platform

NewsCategory = Literal["global", "sports", "pop_culture", "bitcoin", "tech"]

# Canonical live price table with realistic baselines
MARKET_QUOTES: dict[str, dict[str, str]] = {
    "NVDA": {
        "name": "NVIDIA Corp.",
        "asset_class": "EQUITY",
        "price": "211.11",
        "change_pct": "+4.16%",
    },
    "DELL": {
        "name": "Dell Technologies Inc.",
        "asset_class": "EQUITY",
        "price": "456.44",
        "change_pct": "+0.70%",
    },
    "AMD": {
        "name": "Advanced Micro Devices",
        "asset_class": "EQUITY",
        "price": "168.40",
        "change_pct": "+2.85%",
    },
    "TSLA": {
        "name": "Tesla, Inc.",
        "asset_class": "EQUITY",
        "price": "248.90",
        "change_pct": "-1.42%",
    },
    "AAPL": {
        "name": "Apple Inc.",
        "asset_class": "EQUITY",
        "price": "234.15",
        "change_pct": "+0.92%",
    },
    "MSFT": {
        "name": "Microsoft Corp.",
        "asset_class": "EQUITY",
        "price": "442.50",
        "change_pct": "+1.24%",
    },
    "META": {
        "name": "Meta Platforms, Inc.",
        "asset_class": "EQUITY",
        "price": "596.30",
        "change_pct": "+2.10%",
    },
    "GOOGL": {
        "name": "Alphabet Inc.",
        "asset_class": "EQUITY",
        "price": "186.40",
        "change_pct": "+1.15%",
    },
    "AMZN": {
        "name": "Amazon.com, Inc.",
        "asset_class": "EQUITY",
        "price": "212.75",
        "change_pct": "+1.68%",
    },
    "PLTR": {
        "name": "Palantir Technologies",
        "asset_class": "EQUITY",
        "price": "64.20",
        "change_pct": "+5.12%",
    },
    "COIN": {
        "name": "Coinbase Global, Inc.",
        "asset_class": "EQUITY",
        "price": "298.40",
        "change_pct": "+4.80%",
    },
    "MSTR": {
        "name": "MicroStrategy Inc.",
        "asset_class": "EQUITY",
        "price": "385.00",
        "change_pct": "+6.40%",
    },
    "DJT": {
        "name": "Trump Media & Technology",
        "asset_class": "EQUITY",
        "price": "34.50",
        "change_pct": "+7.80%",
    },
    "SPY": {
        "name": "SPDR S&P 500 ETF",
        "asset_class": "ETF",
        "price": "584.20",
        "change_pct": "+0.64%",
    },
    "QQQ": {
        "name": "Invesco QQQ Trust",
        "asset_class": "ETF",
        "price": "502.80",
        "change_pct": "+1.18%",
    },
    "SMH": {
        "name": "VanEck Semiconductor ETF",
        "asset_class": "ETF",
        "price": "262.35",
        "change_pct": "+3.10%",
    },
    "GLD": {
        "name": "SPDR Gold Trust",
        "asset_class": "ETF",
        "price": "254.60",
        "change_pct": "+1.55%",
    },
    "USO": {
        "name": "United States Oil Fund",
        "asset_class": "ETF",
        "price": "78.45",
        "change_pct": "+2.40%",
    },
    "XOM": {
        "name": "Exxon Mobil Corp.",
        "asset_class": "EQUITY",
        "price": "118.60",
        "change_pct": "+2.85%",
    },
    "CVX": {
        "name": "Chevron Corp.",
        "asset_class": "EQUITY",
        "price": "156.40",
        "change_pct": "+2.30%",
    },
    "OXY": {
        "name": "Occidental Petroleum",
        "asset_class": "EQUITY",
        "price": "54.80",
        "change_pct": "+3.15%",
    },
    "XLE": {
        "name": "Energy Select Sector SPDR",
        "asset_class": "ETF",
        "price": "92.30",
        "change_pct": "+2.65%",
    },
    "SCO": {
        "name": "ProShares UltraShort Bloomberg Crude Oil",
        "asset_class": "ETF",
        "price": "18.90",
        "change_pct": "-4.60%",
    },
    "TLT": {
        "name": "iShares 20+ Year Treasury ETF",
        "asset_class": "ETF",
        "price": "94.80",
        "change_pct": "+1.12%",
    },
    "BTC-USD": {
        "name": "Bitcoin Spot",
        "asset_class": "CRYPTO_SPOT",
        "price": "91420.00",
        "change_pct": "+3.84%",
    },
    "ETH-USD": {
        "name": "Ethereum Spot",
        "asset_class": "CRYPTO_SPOT",
        "price": "3240.00",
        "change_pct": "+2.65%",
    },
    "SOL-USD": {
        "name": "Solana Spot",
        "asset_class": "CRYPTO_SPOT",
        "price": "214.50",
        "change_pct": "+5.35%",
    },
    "PAXG-USD": {
        "name": "PAX Gold Commodity Token",
        "asset_class": "CRYPTO_SPOT",
        "price": "2745.00",
        "change_pct": "+1.85%",
    },
    "POWR-USD": {
        "name": "Powerledger Energy Token",
        "asset_class": "CRYPTO_SPOT",
        "price": "0.34",
        "change_pct": "+6.40%",
    },
    "ONDO-USD": {
        "name": "Ondo RWA Yield Token",
        "asset_class": "CRYPTO_SPOT",
        "price": "1.18",
        "change_pct": "+4.20%",
    },
    "RENDER-USD": {
        "name": "Render AI Compute Token",
        "asset_class": "CRYPTO_SPOT",
        "price": "7.85",
        "change_pct": "+5.60%",
    },
    "FET-USD": {
        "name": "Artificial Superintelligence Token",
        "asset_class": "CRYPTO_SPOT",
        "price": "1.64",
        "change_pct": "+6.10%",
    },
    "OIL-PERP": {
        "name": "WTI Crude Oil Perpetual",
        "asset_class": "PERP",
        "price": "74.80",
        "change_pct": "+3.10%",
    },
    "BTC-PERP": {
        "name": "Bitcoin Perpetual",
        "asset_class": "PERP",
        "price": "91450.00",
        "change_pct": "+3.88%",
    },
    "ETH-PERP": {
        "name": "Ethereum Perpetual",
        "asset_class": "PERP",
        "price": "3242.50",
        "change_pct": "+2.71%",
    },
    "SOL-PERP": {
        "name": "Solana Perpetual",
        "asset_class": "PERP",
        "price": "214.80",
        "change_pct": "+5.40%",
    },
    "WETH-USDC": {
        "name": "Wrapped Ether / USDC Pool",
        "asset_class": "DEFI_SWAP",
        "price": "3240.00",
        "change_pct": "+2.65%",
    },
    "PAXG-USDC": {
        "name": "PAX Gold / USDC Onchain Pool",
        "asset_class": "DEFI_SWAP",
        "price": "2745.00",
        "change_pct": "+1.85%",
    },
    "MIDEAST-OIL-YES": {
        "name": "WTI Crude Oil > $90 / Escalation (YES)",
        "asset_class": "PREDICTION",
        "price": "0.42",
        "change_pct": "+8.50%",
    },
    "KXOIL-WTI-90": {
        "name": "Kalshi WTI Crude Oil > $90 (YES)",
        "asset_class": "PREDICTION",
        "price": "0.41",
        "change_pct": "+7.90%",
    },
    "OIL-SPIKE-YES": {
        "name": "ForecastEx Crude Oil Spike (YES)",
        "asset_class": "PREDICTION",
        "price": "0.44",
        "change_pct": "+6.80%",
    },
    "FED-CUT-25BPS-YES": {
        "name": "Fed 25bps Rate Cut (YES Share)",
        "asset_class": "PREDICTION",
        "price": "0.68",
        "change_pct": "+6.25%",
    },
    "KXCPI-CORE": {
        "name": "US Core CPI YoY < 2.5% (YES)",
        "asset_class": "PREDICTION",
        "price": "0.61",
        "change_pct": "+4.10%",
    },
    "KXRECESSION-26": {
        "name": "US Recession Event Contract",
        "asset_class": "PREDICTION",
        "price": "0.24",
        "change_pct": "-3.20%",
    },
}

_NEWS_CACHE: dict[str, tuple[float, list[MarketNewsArticle]]] = {}
_CACHE_TTL_SEC = 45.0

PUBLISHER_STYLES: dict[str, tuple[str, str, str]] = {
    "South China Morning Post": ("SC", "#1E293B", "#FACC15"),
    "Economic Times": ("ET", "#DC2626", "#FFFFFF"),
    "AP NEWS": ("AP", "#171717", "#FFFFFF"),
    "The Jerusalem Post": ("JP", "#B91C1C", "#FFFFFF"),
    "Benzinga": ("BZ", "#1D4ED8", "#FFFFFF"),
    "MarketWatch": ("MW", "#15803D", "#FFFFFF"),
    "The Motley Fool": ("MF", "#7C3AED", "#FFFFFF"),
    "Reuters": ("RT", "#EA580C", "#FFFFFF"),
    "Bloomberg": ("BB", "#111827", "#FFFFFF"),
    "Polymarket Live Odds": ("PM", "#1652F0", "#FFFFFF"),
    "Kalshi Prediction Market": ("KL", "#00C896", "#111827"),
    "Polygon.io Market Wire": ("PG", "#5849BE", "#FFFFFF"),
}


_QUOTE_CACHE: dict[str, tuple[float, dict[str, str]]] = {}
_QUOTE_TTL_SEC = 30.0


def get_live_quote(
    symbol: str,
    asset_class_hint: str | None = None,
    query_hint: str | None = None,
) -> dict[str, str]:
    """Pulls live market price & metadata from Polygon.io (for stocks/ETFs/crypto)
    or Polymarket Gamma API (for prediction contracts), with a 30s cache and baseline fallback.
    """
    clean = symbol.strip().upper()
    if clean == "BTC":
        clean = "BTC-USD"
    elif clean == "ETH":
        clean = "ETH-USD"
    elif clean == "SOL":
        clean = "SOL-PERP"

    now = time.time()
    if clean in _QUOTE_CACHE:
        ts, cached = _QUOTE_CACHE[clean]
        if now - ts < _QUOTE_TTL_SEC:
            return cached

    baseline = MARKET_QUOTES.get(clean)
    resolved_class = asset_class_hint or (baseline["asset_class"] if baseline else "EQUITY")
    api_key = get_polygon_api_key()

    # 1. Prediction Market Contract: Query Polymarket Gamma API if not in static table or live fetch
    if resolved_class == "PREDICTION" or clean.startswith("KX") or "YES" in clean or "NO" in clean:
        search_term = query_hint or clean.replace("-YES", "").replace("-NO", "").replace("-", " ")
        try:
            with httpx.Client(timeout=2.0) as client:
                r = client.get(
                    "https://gamma-api.polymarket.com/public-search",
                    params={"q": search_term[:60]},
                )
                if r.status_code == 200:
                    events = r.json().get("events", [])
                    for ev in events:
                        for mkt in ev.get("markets", []):
                            best_ask = mkt.get("bestAsk") or mkt.get("lastTradePrice")
                            if best_ask is not None:
                                try:
                                    p_val = float(best_ask)
                                    if 0.01 <= p_val <= 0.99:
                                        result = {
                                            "name": str(mkt.get("question") or ev.get("title") or clean)[:54],
                                            "asset_class": "PREDICTION",
                                            "price": f"{p_val:.2f}",
                                            "change_pct": baseline["change_pct"] if baseline else "+4.20%",
                                        }
                                        _QUOTE_CACHE[clean] = (now, result)
                                        return result
                                except (ValueError, TypeError):
                                    pass
        except httpx.HTTPError:
            pass

    # 2. Equity / ETF / Crypto: Query live Polygon.io API when key is configured
    if api_key and resolved_class in ("EQUITY", "ETF", "CRYPTO_SPOT", "PERP"):
        try:
            with httpx.Client(timeout=2.2) as client:
                if resolved_class in ("EQUITY", "ETF") and "-" not in clean:
                    snap_resp = client.get(
                        f"https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/{clean}",
                        params={"apiKey": api_key},
                    )
                    ref_resp = client.get(
                        f"https://api.polygon.io/v3/reference/tickers/{clean}",
                        params={"apiKey": api_key},
                    )
                    price_val: float | None = None
                    chg_pct: float = 0.0
                    if snap_resp.status_code == 200:
                        t_obj = snap_resp.json().get("ticker", {})
                        price_val = (
                            t_obj.get("lastTrade", {}).get("p")
                            or t_obj.get("day", {}).get("c")
                            or t_obj.get("prevDay", {}).get("c")
                        )
                        chg_pct = float(t_obj.get("todaysChangePerc") or 0.0)
                    if price_val is None:
                        prev_resp = client.get(
                            f"https://api.polygon.io/v2/aggs/ticker/{clean}/prev",
                            params={"adjusted": "true", "apiKey": api_key},
                        )
                        if prev_resp.status_code == 200:
                            res_list = prev_resp.json().get("results") or []
                            if res_list:
                                c_p = float(res_list[0].get("c") or 0.0)
                                o_p = float(res_list[0].get("o") or c_p or 1.0)
                                if c_p > 0:
                                    price_val = c_p
                                    chg_pct = ((c_p - o_p) / o_p) * 100.0 if o_p > 0 else 0.0

                    if price_val and float(price_val) > 0:
                        comp_name = baseline["name"] if baseline else f"{clean} Corp."
                        detected_cls = resolved_class
                        if ref_resp.status_code == 200:
                            ref_res = ref_resp.json().get("results") or {}
                            raw_name = str(ref_res.get("name") or "").strip()
                            if raw_name:
                                comp_name = raw_name.replace(" Common Stock", "").replace(" Class A", "")
                            if ref_res.get("type") == "ETF":
                                detected_cls = "ETF"
                        result = {
                            "name": comp_name,
                            "asset_class": detected_cls,
                            "price": f"{float(price_val):.2f}",
                            "change_pct": f"{chg_pct:+.2f}%",
                        }
                        _QUOTE_CACHE[clean] = (now, result)
                        return result
                elif resolved_class in ("CRYPTO_SPOT", "PERP"):
                    base_coin = clean.split("-")[0]
                    poly_pair = f"X:{base_coin}USD"
                    prev_resp = client.get(
                        f"https://api.polygon.io/v2/aggs/ticker/{poly_pair}/prev",
                        params={"adjusted": "true", "apiKey": api_key},
                    )
                    if prev_resp.status_code == 200:
                        res_list = prev_resp.json().get("results") or []
                        if res_list:
                            c_p = float(res_list[0].get("c") or 0.0)
                            o_p = float(res_list[0].get("o") or c_p or 1.0)
                            if c_p > 0:
                                chg_pct = ((c_p - o_p) / o_p) * 100.0 if o_p > 0 else 0.0
                                result = {
                                    "name": baseline["name"] if baseline else f"{base_coin} Spot",
                                    "asset_class": resolved_class,
                                    "price": f"{c_p:.2f}",
                                    "change_pct": f"{chg_pct:+.2f}%",
                                }
                                _QUOTE_CACHE[clean] = (now, result)
                                return result
        except (httpx.HTTPError, ValueError, KeyError, TypeError):
            pass

    if baseline:
        _QUOTE_CACHE[clean] = (now, baseline)
        return baseline

    fallback = {
        "name": f"{clean} Corp.",
        "asset_class": resolved_class,
        "price": "125.00",
        "change_pct": "+1.50%",
    }
    _QUOTE_CACHE[clean] = (now, fallback)
    return fallback


def _curated_articles() -> list[MarketNewsArticle]:
    """Curated multi-category market news matching the design reference and live categories."""
    raw_items = [
        # Global
        {
            "article_id": "news_gl_01",
            "category": "global",
            "publisher_name": "South China Morning Post",
            "published_label": "Oct 7",
            "published_utc": "2026-10-24T14:20:00Z",
            "title": "Trump urged Xi to talk to Takaichi and lift export curbs on Japan, sources say",
            "summary": "Cross-border trade and semiconductor supply chain diplomacy shows signs of easing export bottlenecks across Asia-Pacific technology hubs.",
            "primary_ticker": "NVDA",
            "asset_class": "EQUITY",
            "sentiment_label": "Bullish",
            "source_url": "https://www.scmp.com",
            "workflow_prompt": "Buy NVDA when AI news is bullish",
            "alert_prompt": "Alert me whenever breaking semiconductor export news mentions NVDA or AMD",
        },
        {
            "article_id": "news_gl_02",
            "category": "global",
            "publisher_name": "Economic Times",
            "published_label": "Oct 7",
            "published_utc": "2026-10-24T13:55:00Z",
            "title": "Putin backs mediation efforts on Middle East war, tells Iran Moscow ready to help de-escalate",
            "summary": "Energy markets and safe-haven commodities react as diplomatic channels open around crude oil shipping lanes.",
            "primary_ticker": "GLD",
            "asset_class": "ETF",
            "sentiment_label": "High-Impact Catalyst",
            "source_url": "https://economictimes.indiatimes.com",
            "workflow_prompt": "Whenever Gold rises 1.5% on geopolitical tension news, buy $500 of GLD",
            "alert_prompt": "Notify me when GLD moves 1.5% in 1 hour on geopolitical news",
        },
        {
            "article_id": "news_gl_03",
            "category": "global",
            "publisher_name": "Polymarket Live Odds",
            "published_label": "Live",
            "published_utc": "2026-10-24T15:10:00Z",
            "title": "Polymarket: Fed December 25bps Rate Cut YES contract surges to 68¢ (+6.2% 24h) on $42M volume",
            "summary": "Prediction market orderbooks price in higher probability of a December rate cut ahead of core CPI inflation data.",
            "primary_ticker": "FED-CUT-25BPS-YES",
            "asset_class": "PREDICTION",
            "sentiment_label": "Bullish",
            "source_url": "https://polymarket.com",
            "workflow_prompt": "Buy $300 of Fed Rate Cut YES shares if US CPI inflation comes in below 2.5%",
            "alert_prompt": "Ping me if the Fed December rate cut probability crosses above 75%",
        },
        {
            "article_id": "news_gl_04",
            "category": "global",
            "publisher_name": "Kalshi Prediction Market",
            "published_label": "4m ago",
            "published_utc": "2026-10-24T15:08:00Z",
            "title": "Kalshi WTI Crude Oil > $90 contract spikes +7.9% as Middle East energy traders hedge supply risk",
            "summary": "CFTC-regulated event contracts on Kalshi and oil perpetuals on Hyperliquid see elevated hedging activity.",
            "primary_ticker": "XOM",
            "asset_class": "EQUITY",
            "sentiment_label": "High-Impact Catalyst",
            "source_url": "https://kalshi.com",
            "workflow_prompt": "If trump mentioned about starting a war, you should buy oil related stock and tokens, if trump mentioned about stoping a war in Iran , you should shorting oil",
            "alert_prompt": "Let me know when Kalshi recession odds move by more than 10% in a single day",
        },
        {
            "article_id": "news_gl_05",
            "category": "global",
            "publisher_name": "Polygon.io Market Wire",
            "published_label": "8m ago",
            "published_utc": "2026-10-24T15:06:00Z",
            "title": "Dell Technologies (DELL) climbs to $456.44 on enterprise AI server backlog & social media momentum",
            "summary": "Institutional block flow and X social stream mentions drive elevated volume across DELL and semiconductor peers.",
            "primary_ticker": "DELL",
            "asset_class": "EQUITY",
            "sentiment_label": "Bullish",
            "source_url": "https://polygon.io",
            "workflow_prompt": "Could you monitor if Trump twitts about a Dell again, Buy Dell",
            "alert_prompt": "Alert me whenever breaking news mentions DELL",
        },
        # Tech & AI
        {
            "article_id": "news_tc_01",
            "category": "tech",
            "publisher_name": "Benzinga",
            "published_label": "12m ago",
            "published_utc": "2026-10-24T15:05:00Z",
            "title": "NVIDIA Blackwell Ultra rack shipments exceed hyperscaler Q4 guidance by 18%",
            "summary": "Cloud AI capex commitments from major US hyperscalers accelerate server rack deployments through Q1.",
            "primary_ticker": "NVDA",
            "asset_class": "EQUITY",
            "sentiment_label": "Very Bullish",
            "source_url": "https://www.benzinga.com",
            "workflow_prompt": "Buy NVDA when AI news is bullish",
            "alert_prompt": "Alert me whenever breaking semiconductor export news mentions NVDA or AMD",
        },
        {
            "article_id": "news_tc_02",
            "category": "tech",
            "publisher_name": "MarketWatch",
            "published_label": "34m ago",
            "published_utc": "2026-10-24T14:40:00Z",
            "title": "AMD unveils next-gen Instinct MI350 cluster wins across enterprise AI inference workloads",
            "summary": "Semiconductor ETF SMH climbs +3.1% as data-center GPU demand expands across enterprise cloud providers.",
            "primary_ticker": "AMD",
            "asset_class": "EQUITY",
            "sentiment_label": "Bullish",
            "source_url": "https://www.marketwatch.com",
            "workflow_prompt": "Buy NVDA when AI news is bullish",
            "alert_prompt": "Alert me whenever breaking semiconductor export news mentions NVDA or AMD",
        },
        # Bitcoin & Crypto
        {
            "article_id": "news_bt_01",
            "category": "bitcoin",
            "publisher_name": "Bloomberg",
            "published_label": "18m ago",
            "published_utc": "2026-10-24T14:58:00Z",
            "title": "Spot Bitcoin ETFs record $890M single-day net inflow as institutional treasury allocations rise",
            "summary": "BTC spot orderbooks on Coinbase and Binance tighten above $91,400 amid sustained institutional demand.",
            "primary_ticker": "BTC-USD",
            "asset_class": "CRYPTO_SPOT",
            "sentiment_label": "Very Bullish",
            "source_url": "https://www.bloomberg.com",
            "workflow_prompt": "If Bitcoin breaks above $95,000 on positive ETF inflow news, buy $1,000 BTC",
            "alert_prompt": "Notify me when BTC moves 4% in 1 hour or breaking Bitcoin ETF news drops",
        },
        {
            "article_id": "news_bt_02",
            "category": "bitcoin",
            "publisher_name": "Reuters",
            "published_label": "49m ago",
            "published_utc": "2026-10-24T14:25:00Z",
            "title": "Ethereum L2 rollup throughput hits all-time high while perpetual funding rates stay balanced",
            "summary": "Onchain perpetual open interest on Hyperliquid and dYdX expands 14% week-over-week.",
            "primary_ticker": "ETH-PERP",
            "asset_class": "PERP",
            "sentiment_label": "Bullish",
            "source_url": "https://www.reuters.com",
            "workflow_prompt": "Long $2,000 ETH at 3x leverage whenever ETH drops 5% in 1 hour and rebounds",
            "alert_prompt": "Watch ETH perpetual funding rates and alert me if annualized funding exceeds 35%",
        },
        # Sports
        {
            "article_id": "news_sp_01",
            "category": "sports",
            "publisher_name": "Benzinga",
            "published_label": "1h ago",
            "published_utc": "2026-10-24T14:00:00Z",
            "title": "Live sports streaming rights & interactive event volumes surge 29% in Q4",
            "summary": "Major league broadcast partnerships drive record concurrent engagement across digital platforms.",
            "primary_ticker": "SPY",
            "asset_class": "ETF",
            "sentiment_label": "Bullish",
            "source_url": "https://www.benzinga.com",
            "workflow_prompt": "Buy $1,000 of NVDA right now at market",
            "alert_prompt": "Send me an email if AAPL drops below its 20-day moving average on high volume",
        },
        # Pop culture
        {
            "article_id": "news_pc_01",
            "category": "pop_culture",
            "publisher_name": "The Motley Fool",
            "published_label": "2h ago",
            "published_utc": "2026-10-24T13:00:00Z",
            "title": "Apple Vision & global streaming slate top weekend box-office and subscriber projections",
            "summary": "Hardware ecosystem services revenue grows 14% YoY ahead of holiday quarter product cycle.",
            "primary_ticker": "AAPL",
            "asset_class": "EQUITY",
            "sentiment_label": "Bullish",
            "source_url": "https://www.fool.com",
            "workflow_prompt": "Sell 50% of my TSLA position if EV delivery news turns bearish or stock falls 4%",
            "alert_prompt": "Send me an email if AAPL drops below its 20-day moving average on high volume",
        },
    ]

    result: list[MarketNewsArticle] = []
    for item in raw_items:
        pub = str(item["publisher_name"])
        monogram, bg_hex, fg_hex = PUBLISHER_STYLES.get(pub, (pub[:2].upper(), "#171717", "#FFFFFF"))
        asset_cls: AssetClass = item["asset_class"]  # type: ignore[assignment]
        platform = auto_select_platform(str(item["primary_ticker"]), asset_cls, str(item["workflow_prompt"]))
        result.append(
            MarketNewsArticle(
                article_id=str(item["article_id"]),
                category=item["category"],  # type: ignore[arg-type]
                publisher_name=pub,
                publisher_monogram=monogram,
                publisher_bg_hex=bg_hex,
                publisher_fg_hex=fg_hex,
                published_label=str(item["published_label"]),
                published_utc=str(item["published_utc"]),
                title=str(item["title"]),
                summary=str(item["summary"]),
                primary_ticker=str(item["primary_ticker"]),
                asset_class=asset_cls,
                sentiment_label=item["sentiment_label"],  # type: ignore[arg-type]
                source_url=str(item["source_url"]),
                auto_platform=platform,
                workflow_prompt=str(item["workflow_prompt"]),
                alert_prompt=str(item["alert_prompt"]),
            )
        )
    return result


def fetch_market_news_feed(
    category: NewsCategory = "global",
    ticker: str | None = None,
    limit: int = 12,
) -> list[MarketNewsArticle]:
    """Fetches normalized market news with a 45-second cache and clean user-facing sentiment."""
    cache_key = f"{category}:{ticker or 'ALL'}:{limit}"
    now = time.time()
    if cache_key in _NEWS_CACHE:
        ts, cached = _NEWS_CACHE[cache_key]
        if now - ts < _CACHE_TTL_SEC:
            return cached

    base_articles = _curated_articles()
    api_key = get_polygon_api_key()

    # Optionally enrich with live Polygon.io headlines when key is present
    if api_key:
        try:
            ticker_map = {
                "global": None,
                "sports": "DKNG",
                "pop_culture": "NFLX",
                "bitcoin": "COIN",
                "tech": "NVDA",
            }
            query_ticker = ticker or ticker_map.get(category)
            params: dict[str, str | int] = {"limit": min(limit, 10), "order": "desc", "apiKey": api_key}
            if query_ticker:
                params["ticker"] = query_ticker
            with httpx.Client(timeout=2.5) as client:
                resp = client.get("https://api.polygon.io/v2/reference/news", params=params)
                if resp.status_code == 200:
                    payload = resp.json()
                    for idx, raw in enumerate(payload.get("results", [])[:4]):
                        pub_name = raw.get("publisher", {}).get("name", "Market Wire")
                        monogram, bg_hex, fg_hex = PUBLISHER_STYLES.get(
                            pub_name, (pub_name[:2].upper(), "#171717", "#FFFFFF")
                        )
                        tickers = raw.get("tickers") or ["NVDA"]
                        primary = str(tickers[0]).upper()
                        title_str = str(raw.get("title", "")).strip()
                        if not title_str:
                            continue
                        lower_t = title_str.lower()
                        sentiment: SentimentLabel = "Bullish"
                        if any(w in lower_t for w in ["drop", "fall", "miss", "cut", "risk", "curb"]):
                            sentiment = "High-Impact Catalyst"
                        plat = auto_select_platform(primary, "EQUITY", title_str)
                        base_articles.insert(
                            idx + 2,
                            MarketNewsArticle(
                                article_id=str(raw.get("id", f"live_{idx}")),
                                category=category,
                                publisher_name=pub_name,
                                publisher_monogram=monogram,
                                publisher_bg_hex=bg_hex,
                                publisher_fg_hex=fg_hex,
                                published_label="Live",
                                published_utc=str(raw.get("published_utc", "2026-10-24T15:00:00Z")),
                                title=title_str,
                                summary=str(raw.get("description") or title_str)[:180],
                                primary_ticker=primary,
                                asset_class="EQUITY",
                                sentiment_label=sentiment,
                                source_url=str(raw.get("article_url", "https://www.marketwatch.com")),
                                auto_platform=plat,
                                workflow_prompt=f"Buy {primary} when AI news is bullish",
                                alert_prompt=f"Alert me whenever breaking news mentions {primary}",
                            ),
                        )
        except (httpx.HTTPError, ValueError, KeyError):
            base_articles = _curated_articles()

    filtered = [
        a
        for a in base_articles
        if (category == "global" or a.category == category)
        and (not ticker or ticker.upper() == "ALL" or a.primary_ticker.upper() == ticker.upper())
    ]
    if not filtered:
        filtered = base_articles[:limit]

    result = filtered[:limit]
    _NEWS_CACHE[cache_key] = (now, result)
    return result
