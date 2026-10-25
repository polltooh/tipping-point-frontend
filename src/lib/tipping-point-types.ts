/**
 * Canonical TypeScript Domain Contracts for Catalyst (FRONTEND_DESIGN.md & BACKEND_DESIGN.md).
 * Zero backend data-provider jargon ("Polygon.io" / "News Score") is exposed in user-facing labels.
 */

export type AssetClass =
  | "EQUITY"
  | "ETF"
  | "CRYPTO_SPOT"
  | "PERP"
  | "DEFI_SWAP"
  | "PREDICTION";

export type OutcomeMode =
  | "STRATEGY_WORKFLOW"
  | "SMART_NOTICE"
  | "DIRECT_ACTION"
  | "ASK_USER_CONFIRMATION";

export type SentimentLabel =
  | "Bullish"
  | "Very Bullish"
  | "Bearish"
  | "Neutral"
  | "High-Impact Catalyst";

export type NewsCategory = "global" | "sports" | "pop_culture" | "bitcoin" | "tech";

export type NoticeChannel = "Push" | "Email" | "In-App" | "Webhook";

export type TradeSide =
  | "BUY"
  | "SELL"
  | "SHORT"
  | "SHORT 2x"
  | "BUY YES"
  | "BUY NO"
  | "LONG 2x"
  | "LONG 3x"
  | "SWAP";

export interface PlatformSpec {
  platform_id: string;
  name: string;
  short_name: string;
  venue_label: string;
  category: string;
  logo_svg: string;
  brand_hex: string;
  text_hex: string;
  supported_asset_classes: AssetClass[];
  auth_mode: string;
  masked_account_id: string;
  connected: boolean;
  authorization_epoch: number;
  available_balance_usd: string;
  supported_symbols: string[];
}

export interface ThinkingStep {
  step_number: number;
  title: string;
  detail: string;
  status: "completed" | "active";
  duration_ms: number;
}

export interface SignalNodeSpec {
  node_id: string;
  price_source_label: string; // Always "Live Market Price"
  symbol: string;
  asset_name: string;
  asset_class: AssetClass;
  spot_price: string;
  change_24h_pct: string;
  news_feed_label: string; // Always "Market News Sentiment"
  news_topic: string;
  sentiment_state: SentimentLabel;
  schedule_cadence: string;
}

export interface TriggerNodeSpec {
  node_id: string;
  headline_condition: string;
  operator_label: string;
  clauses: string[];
  evaluation_mode: "State Crossing" | "State Level";
  hysteresis_buffer: string;
  cooldown_window: string;
  missing_data_policy: string;
}

export interface PlatformExecutionRoute {
  platform: PlatformSpec;
  symbol: string;
  asset_name: string;
  asset_class: AssetClass;
  asset_type_label: string;
  side: TradeSide;
  spot_price: string;
  change_24h_pct: string;
  notional_usd: string;
  estimated_units: string;
}

export interface TradeActionNodeSpec {
  node_id: string;
  action_type: "TRADE_ORDER";
  platform: PlatformSpec;
  compatible_platforms: PlatformSpec[];
  execution_routes?: PlatformExecutionRoute[];
  side: TradeSide;
  symbol: string;
  asset_name: string;
  order_type: string;
  notional_usd: string;
  estimated_units: string;
  smart_default_applied: boolean;
  take_profit_pct: string;
  stop_loss_pct: string;
  position_policy: string;
}

export interface SmartNoticeActionNodeSpec {
  node_id: string;
  action_type: "SMART_NOTICE";
  platform: PlatformSpec;
  execution_routes?: PlatformExecutionRoute[];
  symbol: string;
  asset_name: string;
  notice_title: string;
  channels: NoticeChannel[];
  hysteresis: string;
  cooldown: string;
  deduplication_key: string;
  quick_trade_shortcut_symbol: string;
}

export interface WorkflowBranchPathSpec {
  path_id: string;
  path_label: string;
  branch_polarity: "BULLISH_LONG" | "BEARISH_SHORT" | "NEUTRAL_HEDGE";
  connected_signal_ids: string[];
  trigger: TriggerNodeSpec;
  action: TradeActionNodeSpec;
}

export interface WorkflowDiagramSpec {
  strategy_id: string;
  title: string;
  thesis_summary: string;
  version: number;
  environment: "PAPER" | "LIVE";
  semantic_hash: string;
  authorization_epoch: number;
  signal: SignalNodeSpec;
  trigger: TriggerNodeSpec;
  action: TradeActionNodeSpec;
  signals?: SignalNodeSpec[];
  paths?: WorkflowBranchPathSpec[];
}

export interface SmartNoticeDiagramSpec {
  alert_id: string;
  title: string;
  summary: string;
  environment: "PAPER" | "LIVE";
  signal: SignalNodeSpec;
  trigger: TriggerNodeSpec;
  action: SmartNoticeActionNodeSpec;
}

export interface DirectTradeTicketSpec {
  ticket_id: string;
  title: string;
  environment: "PAPER" | "LIVE";
  platform: PlatformSpec;
  compatible_platforms: PlatformSpec[];
  execution_routes?: PlatformExecutionRoute[];
  side: TradeSide;
  symbol: string;
  asset_name: string;
  asset_class: AssetClass;
  order_type: string;
  notional_usd: string;
  estimated_units: string;
  live_price: string;
  change_24h_pct: string;
  quote_id: string;
  quote_expires_in_sec: number;
  available_buying_power_usd: string;
  estimated_fee_usd: string;
  take_profit_pct: string;
  stop_loss_pct: string;
  pretrade_risk_checks_passed: number;
}

export interface LiveContextMetric {
  label: string;
  value: string;
  platform_name: string;
  logo_svg: string;
}

export interface ConfirmationProposalCard {
  option_id: string;
  outcome_to_build: "STRATEGY_WORKFLOW" | "SMART_NOTICE" | "DIRECT_ACTION";
  badge_label: string;
  title: string;
  description: string;
  follow_up_query: string;
  platform: PlatformSpec;
  symbol: string;
  default_notional_usd: string;
  recommended: boolean;
}

export interface InteractiveSlotGroup {
  slot_id: string;
  label: string;
  options: string[];
  selected_default: string;
}

export interface ConfirmationPromptPayload {
  scenario_title: string;
  why_confirmation_needed: string;
  market_synthesis_summary: string;
  live_context: LiveContextMetric[];
  proposals: ConfirmationProposalCard[];
  slot_groups: InteractiveSlotGroup[];
}

export interface CompileQueryResponse {
  query: string;
  outcome_mode: OutcomeMode;
  thinking_steps: ThinkingStep[];
  total_thinking_ms: number;
  auto_selected_platform: PlatformSpec;
  workflow_diagram?: WorkflowDiagramSpec | null;
  notice_diagram?: SmartNoticeDiagramSpec | null;
  direct_trade_ticket?: DirectTradeTicketSpec | null;
  confirmation_prompt?: ConfirmationPromptPayload | null;
}

export interface MarketNewsArticle {
  article_id: string;
  category: NewsCategory;
  publisher_name: string;
  publisher_monogram: string;
  publisher_bg_hex: string;
  publisher_fg_hex: string;
  published_label: string;
  published_utc: string;
  title: string;
  summary: string;
  primary_ticker: string;
  asset_class: AssetClass;
  sentiment_label: SentimentLabel;
  source_url: string;
  auto_platform: PlatformSpec;
  workflow_prompt: string;
  alert_prompt: string;
}

export interface JournalPosting {
  account_code: string;
  side: "DEBIT" | "CREDIT";
  amount_usd: string;
  instrument_symbol?: string | null;
}

export interface ActivityReceiptRecord {
  receipt_id: string;
  timestamp_utc: string;
  event_type:
    | "STRATEGY_ACTIVATED"
    | "DIRECT_ORDER_FILLED"
    | "SMART_NOTICE_ARMED"
    | "CASH_RESERVED"
    | "CONNECTION_VERIFIED";
  title: string;
  subtitle: string;
  environment: "PAPER" | "LIVE";
  platform: PlatformSpec;
  symbol: string;
  notional_usd: string;
  order_state: string;
  correlation_id: string;
  semantic_hash: string;
  client_order_id: string;
  evidence_summary: string;
  postings: JournalPosting[];
}

export interface ActiveStrategyState {
  strategy_id: string;
  title: string;
  thesis_summary: string;
  version: number;
  environment: "PAPER" | "LIVE";
  status: "Active" | "Paper active" | "Paused" | "Stopped";
  platform: PlatformSpec;
  symbol: string;
  side: string;
  allocated_budget_usd: string;
  unitized_pnl_pct: string;
  unitized_pnl_usd: string;
  semantic_hash: string;
  authorization_epoch: number;
  last_evaluated_label: string;
  diagram: WorkflowDiagramSpec;
}

export interface PortfolioSummaryState {
  total_equity_usd: string;
  available_spendable_usd: string;
  reserved_funds_usd: string;
  marked_holdings_usd: string;
  realized_pnl_usd: string;
  unrealized_pnl_usd: string;
  unitized_twr_pct: string;
  active_strategies_count: number;
  active_alerts_count: number;
  connected_platforms_count: number;
}

export interface QueryExampleSpec {
  id: string;
  category: OutcomeMode;
  category_label: string;
  query: string;
  short_label: string;
  auto_platform_id: string;
  symbol: string;
  expected_summary: string;
}
