"""Verification Suite for Catalyst 4-Outcome Intent Compiler, 24 Query Matrix, and OMS."""

from __future__ import annotations

import pytest

from catalyst_backend.domain_models import CompileQueryRequest
from catalyst_backend.intent_compiler import compile_natural_language_query
from catalyst_backend.oms_ledger_engine import CatalystOmsLedgerStore
from catalyst_backend.platform_registry import list_all_platforms


def test_all_16_platforms_registered_with_svg_logos() -> None:
    platforms = list_all_platforms()
    assert len(platforms) == 16
    for plat in platforms:
        assert plat.connected is True
        assert plat.logo_svg.startswith("/assets/logos/")
        assert plat.logo_svg.endswith(".svg")


@pytest.mark.parametrize(
    "query,expected_platform_id,expected_symbol,expected_side",
    [
        ("Buy NVDA when AI news is bullish", "plat_alpaca", "NVDA", "BUY"),
        (
            "If Bitcoin breaks above $95,000 on positive ETF inflow news, buy $1,000 BTC",
            "plat_coinbase",
            "BTC-USD",
            "BUY",
        ),
        (
            "Long $2,000 ETH at 3x leverage whenever ETH drops 5% in 1 hour and rebounds",
            "plat_hyperliquid",
            "ETH-PERP",
            "LONG 3x",
        ),
        (
            "Buy $300 of Fed Rate Cut YES shares if US CPI inflation comes in below 2.5%",
            "plat_polymarket",
            "FED-CUT-25BPS-YES",
            "BUY YES",
        ),
        (
            "Sell 50% of my TSLA position if EV delivery news turns bearish or stock falls 4%",
            "plat_robinhood",
            "TSLA",
            "SELL",
        ),
        (
            "Whenever Gold rises 1.5% on geopolitical tension news, buy $500 of GLD",
            "plat_ibkr",
            "GLD",
            "BUY",
        ),
    ],
)
def test_category_1_trading_workflow_queries_immediately_build_dag(
    query: str,
    expected_platform_id: str,
    expected_symbol: str,
    expected_side: str,
) -> None:
    res = compile_natural_language_query(CompileQueryRequest(query=query))
    assert res.outcome_mode == "STRATEGY_WORKFLOW"
    assert res.workflow_diagram is not None
    assert res.auto_selected_platform.platform_id == expected_platform_id
    assert res.workflow_diagram.action.platform.platform_id == expected_platform_id
    assert res.workflow_diagram.action.symbol == expected_symbol
    assert res.workflow_diagram.action.side == expected_side
    # Ensure zero backend data-provider jargon in user-facing labels
    serialized = res.model_dump_json()
    assert "Polygon.io" not in serialized
    assert "Polygon News Score" not in serialized


@pytest.mark.parametrize(
    "query,expected_platform_id,expected_symbol",
    [
        (
            "Notify me when BTC moves 4% in 1 hour or breaking Bitcoin ETF news drops",
            "plat_binance",
            "BTC-USD",
        ),
        (
            "Alert me whenever breaking semiconductor export news mentions NVDA or AMD",
            "plat_alpaca",
            "NVDA",
        ),
        (
            "Ping me if the Fed December rate cut probability crosses above 75%",
            "plat_polymarket",
            "FED-CUT-25BPS-YES",
        ),
        (
            "Send me an email if AAPL drops below its 20-day moving average on high volume",
            "plat_schwab",
            "AAPL",
        ),
        (
            "Watch ETH perpetual funding rates and alert me if annualized funding exceeds 35%",
            "plat_hyperliquid",
            "ETH-PERP",
        ),
        (
            "Let me know when Kalshi recession odds move by more than 10% in a single day",
            "plat_kalshi",
            "KXRECESSION-26",
        ),
    ],
)
def test_category_2_smart_notification_queries_immediately_build_notice_dag(
    query: str,
    expected_platform_id: str,
    expected_symbol: str,
) -> None:
    res = compile_natural_language_query(CompileQueryRequest(query=query))
    assert res.outcome_mode == "SMART_NOTICE"
    assert res.notice_diagram is not None
    assert res.auto_selected_platform.platform_id == expected_platform_id
    assert res.notice_diagram.action.symbol == expected_symbol
    assert "Polygon" not in res.model_dump_json()


@pytest.mark.parametrize(
    "query,expected_platform_id,expected_symbol,expected_side",
    [
        (
            "Buy $250 of Fed 25bps Cut YES shares right now",
            "plat_polymarket",
            "FED-CUT-25BPS-YES",
            "BUY YES",
        ),
        ("Buy $1,000 of NVDA right now at market", "plat_alpaca", "NVDA", "BUY"),
        ("Market buy 0.5 ETH right now", "plat_coinbase", "ETH-USD", "BUY"),
        ("Open a $1,500 2x long on SOL-PERP right now", "plat_hyperliquid", "SOL-PERP", "LONG 2x"),
        ("Sell 10 shares of TSLA at a $255.00 limit price", "plat_schwab", "TSLA", "SELL"),
        ("Swap $500 USDC into WETH onchain right now", "plat_uniswap", "WETH-USDC", "SWAP"),
    ],
)
def test_category_3_direct_trade_queries_immediately_build_ticket(
    query: str,
    expected_platform_id: str,
    expected_symbol: str,
    expected_side: str,
) -> None:
    res = compile_natural_language_query(CompileQueryRequest(query=query))
    assert res.outcome_mode == "DIRECT_ACTION"
    assert res.direct_trade_ticket is not None
    assert res.auto_selected_platform.platform_id == expected_platform_id
    assert res.direct_trade_ticket.symbol == expected_symbol
    assert res.direct_trade_ticket.side == expected_side
    assert res.direct_trade_ticket.quote_expires_in_sec == 15


@pytest.mark.parametrize(
    "vague_query",
    [
        "How would a surprise Fed rate cut impact Bitcoin and prediction markets?",
        "I want to make a play on tomorrow's CPI inflation report — what can I do?",
        "AI chips look super strong lately, help me set something up.",
        "Hedge my tech portfolio against a Middle East oil spike.",
        "What's the best way to trade the upcoming NVDA earnings call?",
        "Put some money into crypto when the market dips.",
    ],
)
def test_category_4_vague_queries_ask_user_confirmation_and_followup_compiles(
    vague_query: str,
) -> None:
    res = compile_natural_language_query(CompileQueryRequest(query=vague_query))
    assert res.outcome_mode == "ASK_USER_CONFIRMATION"
    assert res.confirmation_prompt is not None
    assert len(res.confirmation_prompt.proposals) >= 3
    # Clicking any confirmation proposal immediately compiles into a concrete diagram
    first_proposal = res.confirmation_prompt.proposals[0]
    follow_res = compile_natural_language_query(
        CompileQueryRequest(query=first_proposal.follow_up_query)
    )
    assert follow_res.outcome_mode == first_proposal.outcome_to_build


def test_oms_and_double_entry_ledger_postings() -> None:
    store = CatalystOmsLedgerStore()
    res = compile_natural_language_query(
        CompileQueryRequest(query="Buy NVDA when AI news is bullish", environment="LIVE")
    )
    assert res.workflow_diagram is not None
    state, receipt = store.activate_workflow(res.workflow_diagram)
    assert state.status == "Active"
    assert len(receipt.postings) == 2
    assert receipt.postings[0].side == "DEBIT"
    assert receipt.postings[1].side == "CREDIT"
    assert receipt.postings[0].amount_usd == receipt.postings[1].amount_usd == "500.00"


def test_gpt5_trump_twitter_dell_query_resolves_dell_and_x_signal() -> None:
    res = compile_natural_language_query(
        CompileQueryRequest(
            query="Could you monitor if Trump twitts about a Dell again, Buy Dell"
        )
    )
    assert res.outcome_mode == "STRATEGY_WORKFLOW"
    assert res.workflow_diagram is not None
    assert res.workflow_diagram.action.symbol == "DELL"
    assert "Dell" in res.workflow_diagram.signal.asset_name
    combined_signal = (
        f"{res.workflow_diagram.signal.news_feed_label} "
        f"{res.workflow_diagram.signal.news_topic} "
        f"{res.workflow_diagram.trigger.headline_condition}"
    ).lower()
    assert "trump" in combined_signal
    assert "x" in combined_signal or "twitter" in combined_signal or "tweet" in combined_signal


def test_oil_stock_and_tokens_generates_all_16_platforms() -> None:
    res = compile_natural_language_query(
        CompileQueryRequest(
            query="If trump mentioned about starting star, buy oil related stock and tokens"
        )
    )
    assert res.outcome_mode == "STRATEGY_WORKFLOW"
    assert res.workflow_diagram is not None
    routes = res.workflow_diagram.action.execution_routes
    assert len(routes) == 16
    route_classes = {r.asset_class for r in routes}
    assert "EQUITY" in route_classes
    assert "ETF" in route_classes
    assert "CRYPTO_SPOT" in route_classes
    assert "PERP" in route_classes
    assert "DEFI_SWAP" in route_classes
    assert "PREDICTION" in route_classes


def test_single_signal_two_outputs_multi_path_war_and_iran_peace_oil_dag() -> None:
    """Verifies that the Trump war / Iran peace prompt generates 1 Signal Block with 2 Outputs (+ / −) leading to 2 Paths."""
    res = compile_natural_language_query(
        CompileQueryRequest(
            query=(
                "If trump mentioned about starting a war, you should buy oil related stock and tokens, "
                "if trump mentioned about stoping a war in Iran , you should shorting oil"
            ),
            environment="PAPER",
        )
    )
    assert res.outcome_mode == "STRATEGY_WORKFLOW"
    wf = res.workflow_diagram
    assert wf is not None

    # One unified Signal Block (not multiple duplicate signal blocks)
    assert len(wf.signals) == 1
    assert "Trump" in wf.signals[0].news_topic

    # Two distinct execution paths (Output + -> Path A: Long Oil Stocks & Tokens; Output - -> Path B: Short Oil & Inverse ETFs)
    assert len(wf.paths) == 2

    path_a = wf.paths[0]
    path_b = wf.paths[1]
    assert path_a.branch_polarity == "BULLISH_LONG"
    assert path_b.branch_polarity == "BEARISH_SHORT"
    assert "starting a war" in path_a.trigger.headline_condition.lower()
    assert "stopping a war in iran" in path_b.trigger.headline_condition.lower()
    assert len(path_a.action.execution_routes) == 16
    assert len(path_b.action.execution_routes) == 16

    # Path A buys oil stocks/tokens, Path B shorts oil / buys inverse oil ETF / buys NO contracts
    path_b_sides = {route.side for route in path_b.action.execution_routes}
    assert any(s in path_b_sides for s in ("SHORT", "SHORT 2x"))
    assert "BUY NO" in path_b_sides


def test_spy_200_day_moving_average_generates_stock_price_signal() -> None:
    """Verifies that 'If SPy is above 200 day moving average, buy spy' resolves SPY and a Stock Price & Technicals signal (never Market News Sentiment)."""
    res = compile_natural_language_query(
        CompileQueryRequest(
            query="If SPy is above 200 day moving average, buy spy",
            environment="PAPER",
        )
    )
    assert res.outcome_mode == "STRATEGY_WORKFLOW"
    wf = res.workflow_diagram
    assert wf is not None
    assert wf.signal.symbol == "SPY"
    assert wf.action.symbol == "SPY"
    assert wf.action.side == "BUY"
    assert "News" not in wf.signal.news_feed_label
    assert "Price" in wf.signal.news_feed_label or "Technical" in wf.signal.news_feed_label
    assert "200" in wf.signal.news_topic
    assert "200" in wf.trigger.headline_condition




