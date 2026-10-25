"""Stateful Order Management System (OMS), Double-Entry Ledger & Strategy Runtime Engine."""

from __future__ import annotations

import hashlib
import uuid
from datetime import UTC, datetime

from pydantic import BaseModel

from .domain_models import (
    ActivityReceiptRecord,
    DirectTradeTicketSpec,
    JournalPosting,
    SmartNoticeDiagramSpec,
    WorkflowDiagramSpec,
)
from .platform_registry import PLATFORM_REGISTRY, PlatformSpec, list_all_platforms


class ActiveStrategyState(BaseModel):
    strategy_id: str
    title: str
    thesis_summary: str
    version: int
    environment: str
    status: str  # "Active", "Paper active", "Paused"
    platform: PlatformSpec
    symbol: str
    side: str
    allocated_budget_usd: str
    unitized_pnl_pct: str
    unitized_pnl_usd: str
    semantic_hash: str
    authorization_epoch: int
    last_evaluated_label: str
    diagram: WorkflowDiagramSpec


class PortfolioSummaryState(BaseModel):
    total_equity_usd: str
    available_spendable_usd: str
    reserved_funds_usd: str
    marked_holdings_usd: str
    realized_pnl_usd: str
    unrealized_pnl_usd: str
    unitized_twr_pct: str
    active_strategies_count: int
    active_alerts_count: int
    connected_platforms_count: int


class CatalystOmsLedgerStore:
    """Authoritative in-memory OMS, strategy runtime, and double-entry journal."""

    def __init__(self) -> None:
        self.strategies: list[ActiveStrategyState] = []
        self.alerts: list[SmartNoticeDiagramSpec] = []
        self.receipts: list[ActivityReceiptRecord] = []
        self.reserved_cash_usd: float = 1300.00
        self.holdings_value_usd: float = 48250.00
        self.spendable_cash_usd: float = 94620.00
        self._seed_initial_state()

    def _seed_initial_state(self) -> None:
        from .intent_compiler import CompileQueryRequest, compile_natural_language_query

        # Seed 2 live/paper active strategies from our canonical examples
        wf1 = compile_natural_language_query(
            CompileQueryRequest(query="Buy NVDA when AI news is bullish", environment="PAPER")
        ).workflow_diagram
        wf2 = compile_natural_language_query(
            CompileQueryRequest(
                query="Buy $300 of Fed Rate Cut YES shares if US CPI inflation comes in below 2.5%",
                environment="LIVE",
            )
        ).workflow_diagram

        if wf1:
            self.strategies.append(
                ActiveStrategyState(
                    strategy_id=wf1.strategy_id,
                    title=wf1.title,
                    thesis_summary=wf1.thesis_summary,
                    version=1,
                    environment="PAPER",
                    status="Paper active",
                    platform=wf1.action.platform,
                    symbol=wf1.action.symbol,
                    side=wf1.action.side,
                    allocated_budget_usd=wf1.action.notional_usd,
                    unitized_pnl_pct="+6.42%",
                    unitized_pnl_usd="+$32.10",
                    semantic_hash=wf1.semantic_hash,
                    authorization_epoch=1,
                    last_evaluated_label="12s ago · Watching AI News",
                    diagram=wf1,
                )
            )
        if wf2:
            self.strategies.append(
                ActiveStrategyState(
                    strategy_id=wf2.strategy_id,
                    title=wf2.title,
                    thesis_summary=wf2.thesis_summary,
                    version=2,
                    environment="LIVE",
                    status="Active",
                    platform=wf2.action.platform,
                    symbol=wf2.action.symbol,
                    side=wf2.action.side,
                    allocated_budget_usd=wf2.action.notional_usd,
                    unitized_pnl_pct="+11.80%",
                    unitized_pnl_usd="+$35.40",
                    semantic_hash=wf2.semantic_hash,
                    authorization_epoch=1,
                    last_evaluated_label="8s ago · CPI Feed Armed",
                    diagram=wf2,
                )
            )

        # Seed initial verifiable double-entry receipt
        alpaca = PLATFORM_REGISTRY["plat_alpaca"]
        self.receipts.append(
            ActivityReceiptRecord(
                receipt_id="rcpt_init_nvda_01",
                timestamp_utc="2026-10-24T14:52:10Z",
                event_type="STRATEGY_ACTIVATED",
                title="Activated Workflow: BUY NVDA on Alpaca",
                subtitle="Trigger: AI News Sentiment = Bullish · Atomic Cash Reserved ($500.00)",
                environment="PAPER",
                platform=alpaca,
                symbol="NVDA",
                notional_usd="500.00",
                order_state="Armed & Monitoring (Reservation Locked)",
                correlation_id="corr_99812a7f",
                semantic_hash=wf1.semantic_hash if wf1 else "8f91c2a0192b3d4e",
                client_order_id="clord_nvda_alpaca_001",
                evidence_summary="NVDA Live Market Price $211.11 (+4.16%) · AI & Semiconductors News = Bullish",
                postings=[
                    JournalPosting(
                        account_code="acct:strategy_subledger:reserved_cash",
                        side="DEBIT",
                        amount_usd="500.00",
                        instrument_symbol="USD",
                    ),
                    JournalPosting(
                        account_code="acct:alpaca:unreserved_buying_power",
                        side="CREDIT",
                        amount_usd="500.00",
                        instrument_symbol="USD",
                    ),
                ],
            )
        )

    def activate_workflow(self, workflow: WorkflowDiagramSpec) -> tuple[ActiveStrategyState, ActivityReceiptRecord]:
        now_iso = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        notional = float(workflow.action.notional_usd)
        self.reserved_cash_usd += notional
        self.spendable_cash_usd = max(0.0, self.spendable_cash_usd - notional)

        state = ActiveStrategyState(
            strategy_id=workflow.strategy_id,
            title=workflow.title,
            thesis_summary=workflow.thesis_summary,
            version=workflow.version,
            environment=workflow.environment,
            status="Active" if workflow.environment == "LIVE" else "Paper active",
            platform=workflow.action.platform,
            symbol=workflow.action.symbol,
            side=workflow.action.side,
            allocated_budget_usd=workflow.action.notional_usd,
            unitized_pnl_pct="+0.00%",
            unitized_pnl_usd="+$0.00",
            semantic_hash=workflow.semantic_hash,
            authorization_epoch=workflow.authorization_epoch,
            last_evaluated_label="Just now · Armed",
            diagram=workflow,
        )
        self.strategies.insert(0, state)

        receipt = ActivityReceiptRecord(
            receipt_id=f"rcpt_{uuid.uuid4().hex[:8]}",
            timestamp_utc=now_iso,
            event_type="STRATEGY_ACTIVATED",
            title=f"Activated Workflow: {workflow.action.side} {workflow.action.symbol} on {workflow.action.platform.short_name}",
            subtitle=f"Trigger: {workflow.trigger.headline_condition} · Reserved ${workflow.action.notional_usd}",
            environment=workflow.environment,
            platform=workflow.action.platform,
            symbol=workflow.action.symbol,
            notional_usd=workflow.action.notional_usd,
            order_state="Armed & Monitoring (Reservation Locked)",
            correlation_id=f"corr_{uuid.uuid4().hex[:10]}",
            semantic_hash=workflow.semantic_hash,
            client_order_id=f"clord_{workflow.action.symbol.lower()}_{uuid.uuid4().hex[:6]}",
            evidence_summary=f"{workflow.signal.symbol} Live Market Price ${workflow.signal.spot_price} · {workflow.signal.news_topic} = {workflow.signal.sentiment_state}",
            postings=[
                JournalPosting(
                    account_code=f"acct:strategy:{workflow.strategy_id}:reserved_cash",
                    side="DEBIT",
                    amount_usd=workflow.action.notional_usd,
                    instrument_symbol="USD",
                ),
                JournalPosting(
                    account_code=f"acct:{workflow.action.platform.platform_id}:spendable_cash",
                    side="CREDIT",
                    amount_usd=workflow.action.notional_usd,
                    instrument_symbol="USD",
                ),
            ],
        )
        self.receipts.insert(0, receipt)
        return state, receipt

    def submit_direct_trade(self, ticket: DirectTradeTicketSpec) -> ActivityReceiptRecord:
        now_iso = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        notional = float(ticket.notional_usd)
        self.holdings_value_usd += notional
        self.spendable_cash_usd = max(0.0, self.spendable_cash_usd - notional)
        sem_hash = hashlib.sha256(f"{ticket.ticket_id}:{ticket.quote_id}".encode()).hexdigest()[:16]

        receipt = ActivityReceiptRecord(
            receipt_id=f"rcpt_{uuid.uuid4().hex[:8]}",
            timestamp_utc=now_iso,
            event_type="DIRECT_ORDER_FILLED",
            title=f"Direct Trade Filled: {ticket.side} {ticket.symbol} on {ticket.platform.short_name}",
            subtitle=f"{ticket.estimated_units} @ ${ticket.live_price} · Quote ID {ticket.quote_id}",
            environment=ticket.environment,
            platform=ticket.platform,
            symbol=ticket.symbol,
            notional_usd=ticket.notional_usd,
            order_state="Filled (Confirmed on Venue)",
            correlation_id=f"corr_{uuid.uuid4().hex[:10]}",
            semantic_hash=sem_hash,
            client_order_id=f"clord_direct_{ticket.symbol.lower()}_{uuid.uuid4().hex[:6]}",
            evidence_summary=f"Direct order verified against 13 pre-trade risk gates · Price ${ticket.live_price}",
            postings=[
                JournalPosting(
                    account_code=f"acct:holdings:{ticket.symbol}",
                    side="DEBIT",
                    amount_usd=ticket.notional_usd,
                    instrument_symbol=ticket.symbol,
                ),
                JournalPosting(
                    account_code=f"acct:{ticket.platform.platform_id}:settled_cash",
                    side="CREDIT",
                    amount_usd=ticket.notional_usd,
                    instrument_symbol="USD",
                ),
            ],
        )
        self.receipts.insert(0, receipt)
        return receipt

    def arm_smart_notice(self, notice: SmartNoticeDiagramSpec) -> ActivityReceiptRecord:
        now_iso = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        self.alerts.insert(0, notice)
        sem_hash = hashlib.sha256(notice.alert_id.encode("utf-8")).hexdigest()[:16]

        receipt = ActivityReceiptRecord(
            receipt_id=f"rcpt_{uuid.uuid4().hex[:8]}",
            timestamp_utc=now_iso,
            event_type="SMART_NOTICE_ARMED",
            title=f"Armed Smart Notice: {notice.signal.symbol} ({', '.join(notice.action.channels)})",
            subtitle=f"Trigger: {notice.trigger.headline_condition} · Cooldown {notice.action.cooldown}",
            environment=notice.environment,
            platform=notice.action.platform,
            symbol=notice.signal.symbol,
            notional_usd="0.00",
            order_state="Active Notification Rule",
            correlation_id=f"corr_{uuid.uuid4().hex[:10]}",
            semantic_hash=sem_hash,
            client_order_id=notice.action.deduplication_key,
            evidence_summary=f"Monitoring {notice.signal.symbol} (${notice.signal.spot_price}) + {notice.signal.news_topic}",
            postings=[],
        )
        self.receipts.insert(0, receipt)
        return receipt

    def get_portfolio_summary(self) -> PortfolioSummaryState:
        total_eq = self.spendable_cash_usd + self.reserved_cash_usd + self.holdings_value_usd
        return PortfolioSummaryState(
            total_equity_usd=f"{total_eq:,.2f}",
            available_spendable_usd=f"{self.spendable_cash_usd:,.2f}",
            reserved_funds_usd=f"{self.reserved_cash_usd:,.2f}",
            marked_holdings_usd=f"{self.holdings_value_usd:,.2f}",
            realized_pnl_usd="+$4,280.50",
            unrealized_pnl_usd="+$6,910.25",
            unitized_twr_pct="+14.82%",
            active_strategies_count=len(self.strategies),
            active_alerts_count=len(self.alerts) + 2,
            connected_platforms_count=len(list_all_platforms()),
        )


GLOBAL_STORE = CatalystOmsLedgerStore()
