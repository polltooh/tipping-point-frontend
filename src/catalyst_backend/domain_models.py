"""Canonical Domain Models for Catalyst Strategy Compiler, 4-Outcome Router, OMS & Ledger."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from .platform_registry import AssetClass, PlatformSpec

OutcomeMode = Literal[
    "STRATEGY_WORKFLOW",
    "SMART_NOTICE",
    "DIRECT_ACTION",
    "ASK_USER_CONFIRMATION",
]

SentimentLabel = Literal["Bullish", "Very Bullish", "Bearish", "Neutral", "High-Impact Catalyst"]

TradeSide = Literal[
    "BUY",
    "SELL",
    "SHORT",
    "SHORT 2x",
    "BUY YES",
    "BUY NO",
    "LONG 2x",
    "LONG 3x",
    "SWAP",
]


class ThinkingStep(BaseModel):
    step_number: int
    title: str
    detail: str
    status: Literal["completed", "active"] = "completed"
    duration_ms: int = 180


class SignalNodeSpec(BaseModel):
    node_id: str = "sig_01"
    price_source_label: str = "Live Market Price"
    symbol: str
    asset_name: str
    asset_class: AssetClass
    spot_price: str
    change_24h_pct: str
    news_feed_label: str = "Market News Sentiment"
    news_topic: str
    sentiment_state: SentimentLabel = "Bullish"
    schedule_cadence: str = "Real-Time Streaming (<= 15s Freshness)"


class TriggerNodeSpec(BaseModel):
    node_id: str = "trig_01"
    headline_condition: str
    operator_label: str = "ALL_OF (AND)"
    clauses: list[str]
    evaluation_mode: Literal["State Crossing", "State Level"] = "State Crossing"
    hysteresis_buffer: str = "0.25%"
    cooldown_window: str = "15m"
    missing_data_policy: str = "Emit Unknown (Never Trigger on Stale Data)"


class PlatformExecutionRoute(BaseModel):
    platform: PlatformSpec
    symbol: str
    asset_name: str
    asset_class: AssetClass
    asset_type_label: str = "Stock"
    side: TradeSide
    spot_price: str
    change_24h_pct: str
    notional_usd: str
    estimated_units: str


class TradeActionNodeSpec(BaseModel):
    node_id: str = "act_trade_01"
    action_type: Literal["TRADE_ORDER"] = "TRADE_ORDER"
    platform: PlatformSpec
    compatible_platforms: list[PlatformSpec] = Field(default_factory=list)
    execution_routes: list[PlatformExecutionRoute] = Field(default_factory=list)
    side: TradeSide
    symbol: str
    asset_name: str
    order_type: str = "Market (Collar <= 35 bps)"
    notional_usd: str = "500.00"
    estimated_units: str
    smart_default_applied: bool = True
    take_profit_pct: str = "+15.0%"
    stop_loss_pct: str = "-5.0%"
    position_policy: str = "Enter Only If Flat (Max 1 Open Leg)"


class WorkflowBranchPathSpec(BaseModel):
    path_id: str = "path_01"
    path_label: str = "Path A · Primary Branch"
    branch_polarity: Literal["BULLISH_LONG", "BEARISH_SHORT", "NEUTRAL_HEDGE"] = "BULLISH_LONG"
    connected_signal_ids: list[str] = Field(default_factory=list)
    trigger: TriggerNodeSpec
    action: TradeActionNodeSpec


class SmartNoticeActionNodeSpec(BaseModel):
    node_id: str = "act_notice_01"
    action_type: Literal["SMART_NOTICE"] = "SMART_NOTICE"
    platform: PlatformSpec
    execution_routes: list[PlatformExecutionRoute] = Field(default_factory=list)
    symbol: str
    asset_name: str
    notice_title: str
    channels: list[Literal["Push", "Email", "In-App", "Webhook"]] = Field(
        default_factory=lambda: ["Push", "Email", "In-App"]
    )
    hysteresis: str = "0.25%"
    cooldown: str = "15m"
    deduplication_key: str
    quick_trade_shortcut_symbol: str


class WorkflowDiagramSpec(BaseModel):
    strategy_id: str
    title: str
    thesis_summary: str
    version: int = 1
    environment: Literal["PAPER", "LIVE"] = "PAPER"
    semantic_hash: str
    authorization_epoch: int = 1
    signal: SignalNodeSpec
    trigger: TriggerNodeSpec
    action: TradeActionNodeSpec
    signals: list[SignalNodeSpec] = Field(default_factory=list)
    paths: list[WorkflowBranchPathSpec] = Field(default_factory=list)


class SmartNoticeDiagramSpec(BaseModel):
    alert_id: str
    title: str
    summary: str
    environment: Literal["PAPER", "LIVE"] = "PAPER"
    signal: SignalNodeSpec
    trigger: TriggerNodeSpec
    action: SmartNoticeActionNodeSpec


class DirectTradeTicketSpec(BaseModel):
    ticket_id: str
    title: str
    environment: Literal["PAPER", "LIVE"] = "PAPER"
    platform: PlatformSpec
    compatible_platforms: list[PlatformSpec] = Field(default_factory=list)
    execution_routes: list[PlatformExecutionRoute] = Field(default_factory=list)
    side: TradeSide
    symbol: str
    asset_name: str
    asset_class: AssetClass
    order_type: str
    notional_usd: str
    estimated_units: str
    live_price: str
    change_24h_pct: str
    quote_id: str
    quote_expires_in_sec: int = 15
    available_buying_power_usd: str
    estimated_fee_usd: str = "0.00"
    take_profit_pct: str = "+15.0%"
    stop_loss_pct: str = "-5.0%"
    pretrade_risk_checks_passed: int = 13


class LiveContextMetric(BaseModel):
    label: str
    value: str
    platform_name: str
    logo_svg: str


class ConfirmationProposalCard(BaseModel):
    option_id: str
    outcome_to_build: Literal["STRATEGY_WORKFLOW", "SMART_NOTICE", "DIRECT_ACTION"]
    badge_label: str
    title: str
    description: str
    follow_up_query: str
    platform: PlatformSpec
    symbol: str
    default_notional_usd: str = "500.00"
    recommended: bool = False


class InteractiveSlotGroup(BaseModel):
    slot_id: str
    label: str
    options: list[str]
    selected_default: str


class ConfirmationPromptPayload(BaseModel):
    scenario_title: str
    why_confirmation_needed: str
    market_synthesis_summary: str
    live_context: list[LiveContextMetric]
    proposals: list[ConfirmationProposalCard]
    slot_groups: list[InteractiveSlotGroup] = Field(default_factory=list)


class CompileQueryRequest(BaseModel):
    query: str
    environment: Literal["PAPER", "LIVE"] = "PAPER"
    override_platform_id: str | None = None
    override_notional_usd: str | None = None


class CompileQueryResponse(BaseModel):
    query: str
    outcome_mode: OutcomeMode
    thinking_steps: list[ThinkingStep]
    total_thinking_ms: int
    auto_selected_platform: PlatformSpec
    workflow_diagram: WorkflowDiagramSpec | None = None
    notice_diagram: SmartNoticeDiagramSpec | None = None
    direct_trade_ticket: DirectTradeTicketSpec | None = None
    confirmation_prompt: ConfirmationPromptPayload | None = None


class MarketNewsArticle(BaseModel):
    article_id: str
    category: Literal["global", "sports", "pop_culture", "bitcoin", "tech"]
    publisher_name: str
    publisher_monogram: str
    publisher_bg_hex: str
    publisher_fg_hex: str
    published_label: str
    published_utc: str
    title: str
    summary: str
    primary_ticker: str
    asset_class: AssetClass
    sentiment_label: SentimentLabel
    source_url: str
    auto_platform: PlatformSpec
    workflow_prompt: str
    alert_prompt: str


class JournalPosting(BaseModel):
    account_code: str
    side: Literal["DEBIT", "CREDIT"]
    amount_usd: str
    instrument_symbol: str | None = None


class ActivityReceiptRecord(BaseModel):
    receipt_id: str
    timestamp_utc: str
    event_type: Literal[
        "STRATEGY_ACTIVATED",
        "DIRECT_ORDER_FILLED",
        "SMART_NOTICE_ARMED",
        "CASH_RESERVED",
        "CONNECTION_VERIFIED",
    ]
    title: str
    subtitle: str
    environment: Literal["PAPER", "LIVE"]
    platform: PlatformSpec
    symbol: str
    notional_usd: str
    order_state: str
    correlation_id: str
    semantic_hash: str
    client_order_id: str
    evidence_summary: str
    postings: list[JournalPosting]
