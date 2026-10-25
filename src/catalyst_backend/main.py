"""Catalyst Backend FastAPI Service (v2 Architecture).

Implements:
- POST /api/v1/compile          (Natural Language Query -> Thinking -> 4 Outcomes)
- GET  /api/v1/news             (Multi-Category Live Market News Feed without provider jargon)
- GET  /api/v1/platforms        (Complete 16-Platform MVP Registry with SVG Brand Logos)
- GET  /api/v1/workspace-state  (Portfolio NAV, Active Strategies, Alerts & Activity Receipts)
- POST /api/v1/workflow/activate
- POST /api/v1/direct-trade/submit
- POST /api/v1/notice/arm
"""

from __future__ import annotations

from typing import Annotated, Literal

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from .domain_models import (
    CompileQueryRequest,
    CompileQueryResponse,
    DirectTradeTicketSpec,
    SmartNoticeDiagramSpec,
    WorkflowDiagramSpec,
)
from .intent_compiler import compile_natural_language_query
from .market_feed_service import NewsCategory, fetch_market_news_feed
from .oms_ledger_engine import GLOBAL_STORE
from .platform_registry import list_all_platforms

app = FastAPI(
    title="Tipping Point Trading Intelligence & Strategy Compiler API",
    version="2.0.0",
    description="Natural Language -> Thinking Process -> 4 Resulting Diagrams (Workflow, Notice, Direct Trade, Confirmation)",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str | int]:
    return {
        "status": "ok",
        "connected_platforms": len(list_all_platforms()),
        "version": "2.0.0",
    }


@app.get("/api/v1/platforms")
def get_platforms() -> dict[str, object]:
    platforms = list_all_platforms()
    return {
        "count": len(platforms),
        "platforms": [p.model_dump() for p in platforms],
    }


@app.get("/api/v1/news")
def get_news_feed(
    category: Annotated[NewsCategory, Query()] = "global",
    ticker: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=30)] = 12,
) -> dict[str, object]:
    articles = fetch_market_news_feed(category=category, ticker=ticker, limit=limit)
    return {
        "status": "Live Feed",
        "category": category,
        "count": len(articles),
        "articles": [a.model_dump() for a in articles],
    }


@app.post("/api/v1/compile", response_model=CompileQueryResponse)
def compile_query_endpoint(req: CompileQueryRequest) -> CompileQueryResponse:
    return compile_natural_language_query(req)


@app.get("/api/v1/workspace-state")
def get_workspace_state() -> dict[str, object]:
    return {
        "portfolio": GLOBAL_STORE.get_portfolio_summary().model_dump(),
        "strategies": [s.model_dump() for s in GLOBAL_STORE.strategies],
        "alerts": [a.model_dump() for a in GLOBAL_STORE.alerts],
        "receipts": [r.model_dump() for r in GLOBAL_STORE.receipts],
        "platforms": [p.model_dump() for p in list_all_platforms()],
    }


@app.post("/api/v1/workflow/activate")
def activate_workflow_endpoint(workflow: WorkflowDiagramSpec) -> dict[str, object]:
    state, receipt = GLOBAL_STORE.activate_workflow(workflow)
    return {
        "status": "activated",
        "strategy": state.model_dump(),
        "receipt": receipt.model_dump(),
        "portfolio": GLOBAL_STORE.get_portfolio_summary().model_dump(),
    }


@app.post("/api/v1/direct-trade/submit")
def submit_direct_trade_endpoint(ticket: DirectTradeTicketSpec) -> dict[str, object]:
    receipt = GLOBAL_STORE.submit_direct_trade(ticket)
    return {
        "status": "filled",
        "receipt": receipt.model_dump(),
        "portfolio": GLOBAL_STORE.get_portfolio_summary().model_dump(),
    }


@app.post("/api/v1/notice/arm")
def arm_smart_notice_endpoint(notice: SmartNoticeDiagramSpec) -> dict[str, object]:
    receipt = GLOBAL_STORE.arm_smart_notice(notice)
    return {
        "status": "armed",
        "receipt": receipt.model_dump(),
        "portfolio": GLOBAL_STORE.get_portfolio_summary().model_dump(),
    }


@app.post("/api/v1/strategies/{strategy_id}/status")
def update_strategy_status(
    strategy_id: str,
    status: Literal["Active", "Paper active", "Paused", "Stopped"] = Query(...),
) -> dict[str, object]:
    for strat in GLOBAL_STORE.strategies:
        if strat.strategy_id == strategy_id:
            strat.status = status
            strat.authorization_epoch += 1
            return {"status": "updated", "strategy": strat.model_dump()}
    return {"status": "not_found"}
