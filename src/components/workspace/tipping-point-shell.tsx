"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ActiveStrategyState,
  ActivityReceiptRecord,
  CompileQueryResponse,
  ConfirmationProposalCard,
  DirectTradeTicketSpec,
  MarketNewsArticle,
  OutcomeMode,
  PortfolioSummaryState,
  SmartNoticeDiagramSpec,
  WorkflowDiagramSpec,
} from "@/lib/tipping-point-types";
import {
  compileNaturalLanguageQuery,
  getCuratedMarketNews,
  getInitialWorkspaceState,
} from "@/lib/tipping-point-compiler";
import {
  PLATFORM_REGISTRY,
  QUERY_EXAMPLES_MATRIX,
  listAllPlatforms,
} from "@/lib/platform-registry";
import {
  CatalystIcon,
  CatalystIconId,
  PlatformBrandLogo,
} from "@/components/design-system/tipping-point-icons";
import {
  ConfirmationDisambiguationView,
  DirectTradeTicketView,
  SmartNoticeDiagramView,
  ThinkingProcessAccordion,
  TradingWorkflowDiagramView,
} from "./diagram-renderers";
import { MarketNewsFeedPanel } from "./market-news-panel";

type NavSection =
  | "research"
  | "markets"
  | "strategies"
  | "portfolio"
  | "activity"
  | "alerts"
  | "connections";

interface ConversationTurn {
  turnId: string;
  userPrompt: string;
  createdAt: string;
  response: CompileQueryResponse;
  isStreaming: boolean;
  activeStepIndex: number;
  simulationBanner: string | null;
}

const NAV_ITEMS: { id: NavSection; label: string; icon: CatalystIconId }[] = [
  { id: "research", label: "Assistant", icon: "I01" },
  { id: "markets", label: "Markets & News", icon: "I02" },
  { id: "strategies", label: "Strategies", icon: "I03" },
  { id: "portfolio", label: "Portfolio", icon: "I04" },
  { id: "activity", label: "Activity", icon: "I05" },
  { id: "alerts", label: "Alerts", icon: "I06" },
  { id: "connections", label: "Connected Accounts", icon: "I07" },
];

const STARTER_CATEGORY_TABS: {
  id: OutcomeMode;
  label: string;
  description: string;
}[] = [
  {
    id: "STRATEGY_WORKFLOW",
    label: "Automate Strategy",
    description: "Conditional trading rules triggered by market news or price",
  },
  {
    id: "SMART_NOTICE",
    label: "Smart Alerts",
    description: "Real-time notifications when market catalysts occur",
  },
  {
    id: "DIRECT_ACTION",
    label: "Instant Trade",
    description: "Immediate market or limit orders routed to your best account",
  },
  {
    id: "ASK_USER_CONFIRMATION",
    label: "Explore Ideas",
    description: "Open-ended market questions where Tipping Point helps you decide",
  },
];

const ALL_PLATFORM_IDS = listAllPlatforms().map((p) => p.platform_id);

const PLATFORM_GROUPS: {
  groupTitle: string;
  groupSubtitle: string;
  platformIds: string[];
}[] = [
  {
    groupTitle: "Stock & ETF Brokerages",
    groupSubtitle: "Equities, Sector ETFs & Listed Options",
    platformIds: [
      "plat_alpaca",
      "plat_ibkr",
      "plat_robinhood",
      "plat_schwab",
      "plat_tradier",
    ],
  },
  {
    groupTitle: "Crypto & Token Exchanges (CEX)",
    groupSubtitle: "Spot Crypto, Commodity Tokens (PAXG), Energy & AI Tokens",
    platformIds: [
      "plat_coinbase",
      "plat_binance",
      "plat_kraken",
      "plat_okx",
      "plat_bybit",
    ],
  },
  {
    groupTitle: "Onchain Perpetuals & DeFi DEXs",
    groupSubtitle: "WTI Crude Oil Perps, Crypto Perps & Onchain Token Pools",
    platformIds: ["plat_hyperliquid", "plat_dydx", "plat_uniswap"],
  },
  {
    groupTitle: "Prediction Markets & Event Contracts",
    groupSubtitle: "Geopolitical, Oil Spike, Fed Rate & Macro Event Contracts",
    platformIds: ["plat_polymarket", "plat_kalshi", "plat_forecastex"],
  },
];

function formatAssistantSummary(
  res: CompileQueryResponse,
  enabledPlatformIds: string[]
): string {
  if (res.outcome_mode === "STRATEGY_WORKFLOW" && res.workflow_diagram) {
    const wf = res.workflow_diagram;
    const allRoutes = wf.action.execution_routes || [];
    const enabledRoutes =
      allRoutes.length > 0
        ? allRoutes.filter((r) => enabledPlatformIds.includes(r.platform.platform_id))
        : [];
    const hiddenCount = allRoutes.length - enabledRoutes.length;

    if (wf.paths && wf.paths.length > 1) {
      const pathDescriptions = wf.paths
        .map(
          (p) =>
            `when "${p.trigger.headline_condition}" → ${p.action.side} ${p.action.symbol} across ${enabledRoutes.length} enabled platforms`
        )
        .join("; and ");
      return `I've compiled a 3-layer workflow (Signal → Trigger → Action) monitoring ${wf.signal.news_feed_label} (${wf.signal.news_topic}) with ${wf.paths.length} conditional branches (${enabledRoutes.length}/${allRoutes.length} platforms enabled in your User Profile${hiddenCount > 0 ? `, ${hiddenCount} disabled & hidden` : ""}): ${pathDescriptions}.`;
    }

    if (enabledRoutes.length > 1) {
      const sampleLegs = enabledRoutes
        .slice(0, 5)
        .map((r) => `${r.symbol} on ${r.platform.short_name}`)
        .join(", ");
      return `I've generated a multi-platform trading workflow across all ${allRoutes.length} platforms (${enabledRoutes.length} enabled in your User Profile${hiddenCount > 0 ? `, ${hiddenCount} disabled & hidden` : ""}). When "${wf.trigger.headline_condition}" triggers, it routes orders to each enabled platform's supported asset — including ${sampleLegs}, and more.`;
    }
    return `I've built an automated trading workflow for ${wf.action.symbol} (${wf.action.asset_name}) on ${wf.action.platform.name}. It monitors ${wf.signal.news_topic} and live price action ($${wf.signal.spot_price}), and will ${wf.action.side.toLowerCase()} $${wf.action.notional_usd} of ${wf.action.symbol} when "${wf.trigger.headline_condition}" is met.`;
  }
  if (res.outcome_mode === "SMART_NOTICE" && res.notice_diagram) {
    const nt = res.notice_diagram;
    return `I've configured a real-time alert for ${nt.signal.symbol} (${nt.signal.news_topic}). You'll be notified via ${nt.action.channels.join(" and ")} as soon as "${nt.trigger.headline_condition}" triggers.`;
  }
  if (res.outcome_mode === "DIRECT_ACTION" && res.direct_trade_ticket) {
    const tk = res.direct_trade_ticket;
    return `I've prepared a direct ${tk.side.toLowerCase()} order for $${tk.notional_usd} of ${tk.symbol} (${tk.estimated_units}) routed across your enabled trading accounts (primary: ${tk.platform.name}). Review the quote below to submit.`;
  }
  return (
    res.confirmation_prompt?.market_synthesis_summary ||
    "Here are the best ways to act on that idea using your connected accounts:"
  );
}

export function TippingPointWorkspaceShell() {
  const initial = getInitialWorkspaceState();
  const [activeNav, setActiveNav] = useState<NavSection>("research");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [environment, setEnvironment] = useState<"PAPER" | "LIVE">("PAPER");
  const [showRightNewsDrawer, setShowRightNewsDrawer] = useState<boolean>(false);
  const [quickTradeOpen, setQuickTradeOpen] = useState<boolean>(false);
  const [userProfileOpen, setUserProfileOpen] = useState<boolean>(false);

  // User Profile Platform Toggles — By default ALL 16 platforms are enabled
  const [enabledPlatformIds, setEnabledPlatformIds] =
    useState<string[]>(ALL_PLATFORM_IDS);

  const togglePlatformEnabled = (platformId: string) => {
    setEnabledPlatformIds((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  // Conversational Chat State — Starts completely empty (Zero-State Chatbox like ChatGPT)
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [composerText, setComposerText] = useState<string>("");
  const [starterCategory, setStarterCategory] =
    useState<OutcomeMode>("STRATEGY_WORKFLOW");
  const [showAllPromptsModal, setShowAllPromptsModal] = useState<boolean>(false);
  const [toastBanner, setToastBanner] = useState<string | null>(null);

  // Portfolio, Strategies, Alerts & Activity Receipts State
  const [portfolio, setPortfolio] = useState<PortfolioSummaryState>(initial.portfolio);
  const [strategies, setStrategies] = useState<ActiveStrategyState[]>(initial.strategies);
  const [alerts, setAlerts] = useState<SmartNoticeDiagramSpec[]>(initial.alerts);
  const [receipts, setReceipts] = useState<ActivityReceiptRecord[]>(initial.receipts);
  const [selectedReceipt, setSelectedReceipt] = useState<ActivityReceiptRecord | null>(
    initial.receipts[0] || null
  );
  const [rollingNews, setRollingNews] = useState<MarketNewsArticle[]>(() =>
    getCuratedMarketNews("global")
  );

  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  // Poll live Polygon.io & Prediction Market rolling news for the main page ticker
  useEffect(() => {
    let cancelled = false;
    async function refreshRollingNews() {
      try {
        const res = await fetch("/api/news?category=global", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (Array.isArray(data.articles) && data.articles.length > 0 && !cancelled) {
          setRollingNews(data.articles);
        }
      } catch {
        // Keep fallback news
      }
    }
    refreshRollingNews();
    const timer = setInterval(refreshRollingNews, 45000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (turns.length > 0) {
      const latestTurnId = turns[turns.length - 1]?.turnId;
      const el = latestTurnId ? document.getElementById(latestTurnId) : null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [turns.length]);

  const showToast = (msg: string) => {
    setToastBanner(msg);
    const t = setTimeout(() => setToastBanner(null), 4500);
    timersRef.current.push(t);
  };

  const handleStartNewChat = () => {
    clearTimers();
    setTurns([]);
    setComposerText("");
    setActiveNav("research");
    setTimeout(() => composerInputRef.current?.focus(), 50);
  };

  /**
   * Submits a natural-language user prompt:
   * 1. Appends the user's message to the conversation timeline.
   * 2. Streams the ThinkingProcessAccordion step-by-step (Stage A: No diagram shown yet).
   * 3. Once thinking finishes (~880ms), collapses thinking pill and reveals the resulting diagram (Stage B).
   */
  const submitPrompt = async (
    rawQuery: string,
    overridePlatformId?: string,
    overrideNotionalUsd?: string
  ) => {
    const clean = rawQuery.trim();
    if (!clean) return;

    setComposerText("");
    setShowAllPromptsModal(false);
    setActiveNav("research");

    const turnId = `turn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const localTarget = compileNaturalLanguageQuery(
      clean,
      environment,
      overridePlatformId,
      overrideNotionalUsd
    );

    const newTurn: ConversationTurn = {
      turnId,
      userPrompt: clean,
      createdAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      response: localTarget,
      isStreaming: true,
      activeStepIndex: 0,
      simulationBanner: null,
    };

    setTurns((prev) => [...prev, newTurn]);

    // Step-by-step thinking progress animation while OpenAI GPT-5 + Polygon/Prediction backend resolves
    for (let step = 1; step <= 3; step++) {
      const stepTimer = setTimeout(() => {
        setTurns((prev) =>
          prev.map((t) =>
            t.turnId === turnId ? { ...t, activeStepIndex: step } : t
          )
        );
      }, step * 260);
      timersRef.current.push(stepTimer);
    }

    const startMs = Date.now();
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: clean,
          environment,
          override_platform_id: overridePlatformId,
          override_notional_usd: overrideNotionalUsd,
        }),
      });
      if (res.ok) {
        const remoteData: CompileQueryResponse = await res.json();
        const elapsed = Date.now() - startMs;
        const waitMore = Math.max(0, 750 - elapsed);
        const doneTimer = setTimeout(() => {
          setTurns((prev) =>
            prev.map((t) =>
              t.turnId === turnId
                ? {
                    ...t,
                    response: {
                      ...remoteData,
                      total_thinking_ms: Math.max(remoteData.total_thinking_ms, elapsed),
                    },
                    isStreaming: false,
                    activeStepIndex: 4,
                  }
                : t
            )
          );
        }, waitMore);
        timersRef.current.push(doneTimer);
        return;
      }
    } catch {
      // Fallback to local compiler below
    }

    const fallbackTimer = setTimeout(() => {
      setTurns((prev) =>
        prev.map((t) =>
          t.turnId === turnId
            ? { ...t, isStreaming: false, activeStepIndex: 4 }
            : t
        )
      );
    }, 850);
    timersRef.current.push(fallbackTimer);
  };

  /**
   * Mutates an existing turn in-place when the user adjusts platform or order size inside a card.
   */
  const updateTurnCompilationInPlace = async (
    turnId: string,
    query: string,
    overridePlatformId?: string,
    overrideNotionalUsd?: string
  ) => {
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          environment,
          override_platform_id: overridePlatformId,
          override_notional_usd: overrideNotionalUsd,
        }),
      });
      if (res.ok) {
        const remoteData: CompileQueryResponse = await res.json();
        setTurns((prev) =>
          prev.map((t) => (t.turnId === turnId ? { ...t, response: remoteData } : t))
        );
        return;
      }
    } catch {
      // Fallback below
    }
    const updated = compileNaturalLanguageQuery(
      query,
      environment,
      overridePlatformId,
      overrideNotionalUsd
    );
    setTurns((prev) =>
      prev.map((t) => (t.turnId === turnId ? { ...t, response: updated } : t))
    );
  };

  const handleActivateWorkflow = (workflow: WorkflowDiagramSpec) => {
    const newStrategy: ActiveStrategyState = {
      strategy_id: `${workflow.strategy_id}_${Date.now().toString().slice(-3)}`,
      title: workflow.title,
      thesis_summary: workflow.thesis_summary,
      version: workflow.version,
      environment,
      status: environment === "LIVE" ? "Active" : "Paper active",
      platform: workflow.action.platform,
      symbol: workflow.action.symbol,
      side: workflow.action.side,
      allocated_budget_usd: workflow.action.notional_usd,
      unitized_pnl_pct: "+0.00%",
      unitized_pnl_usd: "+$0.00",
      semantic_hash: workflow.semantic_hash,
      authorization_epoch: workflow.authorization_epoch,
      last_evaluated_label: "Just now · Armed & Monitoring",
      diagram: { ...workflow, environment },
    };

    const newReceipt: ActivityReceiptRecord = {
      receipt_id: `rcpt_wf_${Date.now().toString().slice(-6)}`,
      timestamp_utc: new Date().toISOString(),
      event_type: "STRATEGY_ACTIVATED",
      title: `Activated Strategy: ${workflow.action.side} ${workflow.action.symbol} on ${workflow.action.platform.short_name}`,
      subtitle: `Trigger: ${workflow.trigger.headline_condition} · Reserved $${workflow.action.notional_usd}`,
      environment,
      platform: workflow.action.platform,
      symbol: workflow.action.symbol,
      notional_usd: workflow.action.notional_usd,
      order_state: "Armed & Monitoring",
      correlation_id: `corr_${workflow.semantic_hash.slice(0, 10)}`,
      semantic_hash: workflow.semantic_hash,
      client_order_id: `clord_${workflow.action.symbol.toLowerCase()}_${Date.now().toString().slice(-5)}`,
      evidence_summary: `${workflow.signal.symbol} Market Price $${workflow.signal.spot_price} · ${workflow.signal.news_topic} = ${workflow.signal.sentiment_state}`,
      postings: [
        {
          account_code: `acct:strategy:${workflow.strategy_id}:reserved_cash`,
          side: "DEBIT",
          amount_usd: workflow.action.notional_usd,
          instrument_symbol: "USD",
        },
        {
          account_code: `acct:${workflow.action.platform.platform_id}:unreserved_buying_power`,
          side: "CREDIT",
          amount_usd: workflow.action.notional_usd,
          instrument_symbol: "USD",
        },
      ],
    };

    setStrategies((prev) => [newStrategy, ...prev]);
    setReceipts((prev) => [newReceipt, ...prev]);
    setSelectedReceipt(newReceipt);
    setPortfolio((prev) => ({
      ...prev,
      active_strategies_count: prev.active_strategies_count + 1,
    }));
    showToast(
      `✓ Strategy Activated on ${workflow.action.platform.name}: ${workflow.action.side} $${workflow.action.notional_usd} ${workflow.action.symbol}`
    );
  };

  const handleArmNotice = (notice: SmartNoticeDiagramSpec) => {
    const newReceipt: ActivityReceiptRecord = {
      receipt_id: `rcpt_nt_${Date.now().toString().slice(-6)}`,
      timestamp_utc: new Date().toISOString(),
      event_type: "SMART_NOTICE_ARMED",
      title: `Enabled Alert: ${notice.signal.symbol} (${notice.action.channels.join(", ")})`,
      subtitle: `Trigger: ${notice.trigger.headline_condition}`,
      environment,
      platform: notice.action.platform,
      symbol: notice.signal.symbol,
      notional_usd: "0.00",
      order_state: "Active Alert",
      correlation_id: `corr_${notice.alert_id}`,
      semantic_hash: notice.alert_id,
      client_order_id: notice.action.deduplication_key,
      evidence_summary: `Monitoring ${notice.signal.symbol} ($${notice.signal.spot_price}) + ${notice.signal.news_topic}`,
      postings: [],
    };
    setAlerts((prev) => [notice, ...prev]);
    setReceipts((prev) => [newReceipt, ...prev]);
    setSelectedReceipt(newReceipt);
    setPortfolio((prev) => ({
      ...prev,
      active_alerts_count: prev.active_alerts_count + 1,
    }));
    showToast(
      `✓ Smart Alert Enabled for ${notice.signal.symbol} via ${notice.action.channels.join(" + ")}`
    );
  };

  const handleSubmitDirectTrade = (ticket: DirectTradeTicketSpec) => {
    const newReceipt: ActivityReceiptRecord = {
      receipt_id: `rcpt_dt_${Date.now().toString().slice(-6)}`,
      timestamp_utc: new Date().toISOString(),
      event_type: "DIRECT_ORDER_FILLED",
      title: `Order Filled: ${ticket.side} ${ticket.symbol} on ${ticket.platform.short_name}`,
      subtitle: `${ticket.estimated_units} @ $${ticket.live_price}`,
      environment,
      platform: ticket.platform,
      symbol: ticket.symbol,
      notional_usd: ticket.notional_usd,
      order_state: "Filled",
      correlation_id: `corr_${ticket.quote_id}`,
      semantic_hash: ticket.ticket_id,
      client_order_id: `clord_direct_${ticket.symbol.toLowerCase()}_${Date.now().toString().slice(-5)}`,
      evidence_summary: `Executed @ $${ticket.live_price} on ${ticket.platform.name}`,
      postings: [
        {
          account_code: `acct:holdings:${ticket.symbol}`,
          side: "DEBIT",
          amount_usd: ticket.notional_usd,
          instrument_symbol: ticket.symbol,
        },
        {
          account_code: `acct:${ticket.platform.platform_id}:settled_cash`,
          side: "CREDIT",
          amount_usd: ticket.notional_usd,
          instrument_symbol: "USD",
        },
      ],
    };
    setReceipts((prev) => [newReceipt, ...prev]);
    setSelectedReceipt(newReceipt);
    setQuickTradeOpen(false);
    showToast(
      `✓ Order Filled on ${ticket.platform.name}: ${ticket.side} $${ticket.notional_usd} ${ticket.symbol} (${ticket.estimated_units})`
    );
  };

  const handleConfirmationProposalClick = (proposal: ConfirmationProposalCard) => {
    submitPrompt(
      proposal.follow_up_query,
      proposal.platform.platform_id,
      proposal.default_notional_usd !== "0.00" ? proposal.default_notional_usd : undefined
    );
  };

  const starterExamples = QUERY_EXAMPLES_MATRIX.filter(
    (ex) => ex.category === starterCategory
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#FFFFFF] text-[#171717]">
      {/* TOP BAR (Responsive Minimalist App Header for Mobile & Laptop) */}
      <header className="z-30 flex h-[54px] shrink-0 items-center justify-between gap-2 overflow-x-hidden border-b border-[#F2F2F0] bg-white px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {/* Toggle Sidebar Menu Button */}
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#626262] transition-colors hover:bg-[#F5F5F4] hover:text-[#171717]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2.5 4.5H13.5M2.5 8H13.5M2.5 11.5H9.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleStartNewChat}
            className="flex shrink-0 items-center gap-2 text-left whitespace-nowrap"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-[#171717] font-mono text-[11px] font-bold text-white">
              TP
            </span>
            <span className="text-[14px] font-semibold tracking-tight text-[#171717] sm:text-[15px]">
              Tipping Point
            </span>
          </button>

          {turns.length > 0 && (
            <button
              type="button"
              onClick={handleStartNewChat}
              className="ml-0.5 inline-flex shrink-0 items-center gap-1 rounded-full border border-[#EAEAE7] bg-white px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-[#171717] transition-colors hover:bg-[#F5F5F4] sm:ml-1 sm:px-3 sm:text-[12px]"
            >
              <CatalystIcon id="I09" size={12} />
              <span className="hidden sm:inline">New Chat</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>

        {/* Minimal Right Header Controls */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div
            role="group"
            aria-label="Execution Mode"
            className="inline-flex shrink-0 items-center rounded-full border border-[#EAEAE7] bg-[#F8F8F7] p-0.5"
          >
            <button
              type="button"
              onClick={() => setEnvironment("PAPER")}
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap transition-colors sm:px-2.5 ${
                environment === "PAPER"
                  ? "bg-white text-[#171717] shadow-2xs"
                  : "text-[#626262] hover:text-[#171717]"
              }`}
            >
              Paper
            </button>
            <button
              type="button"
              onClick={() => setEnvironment("LIVE")}
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap transition-colors sm:px-2.5 ${
                environment === "LIVE"
                  ? "bg-[#171717] text-white shadow-2xs"
                  : "text-[#626262] hover:text-[#171717]"
              }`}
            >
              Live
            </button>
          </div>

          <button
            type="button"
            onClick={() => setUserProfileOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#EAEAE7] bg-white px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-[#171717] transition-colors hover:bg-[#F5F5F4] sm:px-3 sm:text-[12px]"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#356B2B]" />
            <span className="hidden sm:inline">
              User Profile · {enabledPlatformIds.length}/16 Platforms
            </span>
            <span className="sm:hidden">
              Profile {enabledPlatformIds.length}/16
            </span>
          </button>
        </div>
      </header>

      {/* Action Confirmation Toast Banner */}
      {toastBanner && (
        <div className="z-20 flex shrink-0 items-center justify-between border-b border-[#B7D7B0] bg-[#E8F1E6] px-6 py-2 text-[13px] font-semibold text-[#26531E]">
          <span>{toastBanner}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveNav("activity")}
              className="underline hover:no-underline"
            >
              View Receipt →
            </button>
            <button
              type="button"
              onClick={() => setToastBanner(null)}
              aria-label="Dismiss notification"
            >
              <CatalystIcon id="I18" size={15} />
            </button>
          </div>
        </div>
      )}

      {/* MAIN WORKSPACE BODY */}
      <div className="relative flex min-h-0 flex-1">
        {/* Collapsible Left Navigation Sidebar (Overlay Drawer on Mobile, Inline on Desktop) */}
        {sidebarOpen && (
          <>
            <div
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
              className="fixed inset-0 z-40 bg-black/25 lg:hidden"
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-[250px] shrink-0 flex-col justify-between border-r border-[#EAEAE7] bg-[#FBFBFA] p-3 shadow-xl lg:static lg:z-auto lg:w-[220px] lg:shadow-none">
            <div className="space-y-4">
              {/* New Chat Primary Action */}
              <button
                type="button"
                onClick={handleStartNewChat}
                className="flex w-full items-center justify-between rounded-[10px] border border-[#DEDEDC] bg-white px-3 py-2 text-[13px] font-semibold text-[#171717] shadow-2xs transition-colors hover:bg-[#F5F5F4]"
              >
                <span className="flex items-center gap-2">
                  <CatalystIcon id="I09" size={15} />
                  <span>New Chat</span>
                </span>
              </button>

              <nav aria-label="Workspace Navigation" className="space-y-0.5">
                {NAV_ITEMS.map((item) => {
                  const selected = activeNav === item.id;
                  const badgeVal =
                    item.id === "strategies"
                      ? String(strategies.length)
                      : item.id === "alerts"
                      ? String(alerts.length)
                      : item.id === "activity"
                      ? String(receipts.length)
                      : undefined;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveNav(item.id)}
                      className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-[13px] transition-colors ${
                        selected
                          ? "bg-[#EAEAE7]/80 font-semibold text-[#171717]"
                          : "font-medium text-[#626262] hover:bg-[#EAEAE7]/40 hover:text-[#171717]"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <CatalystIcon id={item.icon} size={17} />
                        <span>{item.label}</span>
                      </span>
                      {badgeVal && (
                        <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-[#626262] shadow-2xs tabular-nums">
                          {badgeVal}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Recent Thread History in Sidebar */}
              {turns.length > 0 && (
                <div className="border-t border-[#EAEAE7] pt-3">
                  <div className="px-2 text-[11px] font-semibold text-[#626262]">
                    Current Session
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {turns.map((t) => (
                      <button
                        key={t.turnId}
                        type="button"
                        onClick={() => setActiveNav("research")}
                        className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-left text-[12px] text-[#171717] hover:bg-[#EAEAE7]/50"
                      >
                        <PlatformBrandLogo
                          platform={t.response.auto_selected_platform}
                          size={16}
                        />
                        <span className="truncate font-medium">{t.userPrompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Connected Venues Footer */}
            <button
              type="button"
              onClick={() => setActiveNav("connections")}
              className="w-full rounded-[10px] border border-[#EAEAE7] bg-white p-3 text-left transition-colors hover:border-[#DEDEDC]"
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#171717]">
                <span>Connected Venues</span>
                <span className="text-[#356B2B]">● 16 Active</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {[
                  PLATFORM_REGISTRY.plat_alpaca,
                  PLATFORM_REGISTRY.plat_polymarket,
                  PLATFORM_REGISTRY.plat_coinbase,
                  PLATFORM_REGISTRY.plat_hyperliquid,
                  PLATFORM_REGISTRY.plat_kalshi,
                  PLATFORM_REGISTRY.plat_ibkr,
                ].map((p) => (
                  <PlatformBrandLogo key={p.platform_id} platform={p} size={20} />
                ))}
              </div>
            </button>
          </aside>
          </>
        )}

        {/* CENTER + RIGHT CONTAINER */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* VIEW 1: CONVERSATIONAL AI ASSISTANT (Simple, Clean Front Page like ChatGPT) */}
          {activeNav === "research" && (
            <div className="flex min-h-0 flex-1">
              {/* Primary Chat Column */}
              <div className="flex min-w-0 flex-1 flex-col justify-between bg-white">
                {turns.length === 0 ? (
                  /* ============================================================
                   * ZERO-STATE: ULTRA-CLEAN CENTERED CHATBOX
                   * ============================================================ */
                  <div className="flex flex-1 flex-col items-center justify-center px-4 pb-12">
                    <div className="w-full max-w-[680px]">
                      {/* Simple, Calm Headline */}
                      <h1 className="text-center text-[28px] font-semibold tracking-tight text-[#171717] sm:text-[32px]">
                        Every trade starts with a tipping point.
                      </h1>

                      {/* Centered ChatGPT-Style Composer Box */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          submitPrompt(composerText);
                        }}
                        className="mt-6 overflow-hidden rounded-[22px] border border-[#DFDFDC] bg-white shadow-[0_4px_24px_rgb(0,0,0,0.05)] transition-all focus-within:border-[#171717]"
                      >
                        <textarea
                          ref={composerInputRef}
                          rows={2}
                          value={composerText}
                          onChange={(e) => setComposerText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              submitPrompt(composerText);
                            }
                          }}
                          placeholder="Ask anything... e.g. Monitor if Trump tweets about Dell again, buy Dell"
                          aria-label="Message Tipping Point"
                          className="w-full resize-none border-0 bg-transparent px-5 pt-4 pb-2 text-[16px] leading-relaxed text-[#171717] placeholder:text-[#8E8E8C] focus:outline-none sm:text-[15px]"
                        />
                        <div className="flex items-center justify-between px-4 pb-3">
                          <button
                            type="button"
                            onClick={() => setShowAllPromptsModal(true)}
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium text-[#626262] transition-colors hover:bg-[#F5F5F4] hover:text-[#171717]"
                          >
                            <span>Examples</span>
                          </button>

                          <button
                            type="submit"
                            disabled={!composerText.trim()}
                            aria-label="Send prompt"
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                              composerText.trim()
                                ? "bg-[#171717] text-white hover:bg-[#2E2E2E]"
                                : "bg-[#EAEAE7] text-[#8E8E8C]"
                            }`}
                          >
                            <span className="text-[15px] font-bold leading-none">
                              ↑
                            </span>
                          </button>
                        </div>
                      </form>

                      {/* Recommended Questions (Actual Natural-Language Questions) */}
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        {[
                          {
                            label:
                              "If Trump mentions starting a war, buy oil stocks and tokens; if Trump mentions stopping a war in Iran, short oil",
                            prompt:
                              "If trump mentioned about starting a war, you should buy oil related stock and tokens, if trump mentioned about stoping a war in Iran , you should shorting oil",
                          },
                          {
                            label:
                              "Could you monitor if Trump tweets about Dell again, and buy Dell?",
                            prompt:
                              "Could you monitor if Trump twitts about a Dell again, Buy Dell",
                          },
                          {
                            label: "Buy NVDA when AI news is bullish",
                            prompt: "Buy NVDA when AI news is bullish",
                          },
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => submitPrompt(item.prompt)}
                            className="rounded-full border border-[#EAEAE7] bg-[#FBFBFA] px-3.5 py-1.5 text-left text-[12px] font-medium text-[#626262] transition-colors hover:border-[#171717] hover:bg-white hover:text-[#171717]"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>

                      {/* LIVE ROLLING NEWS FEED (Polygon.io · Polymarket · Kalshi · Financial Wires) */}
                      <div className="mt-8 w-full overflow-hidden rounded-[14px] border border-[#EAEAE7] bg-[#FBFBFA] py-2.5 shadow-2xs">
                        <div className="mb-2 flex items-center justify-between px-3.5">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#356B2B]" />
                            <span className="text-[11px] font-bold tracking-wider text-[#171717] uppercase">
                              Live Rolling News
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowRightNewsDrawer(true)}
                            className="text-[11px] font-semibold text-[#626262] transition-colors hover:text-[#171717]"
                          >
                            All News →
                          </button>
                        </div>

                        <div className="relative w-full overflow-hidden">
                          <div className="catalyst-news-marquee-track gap-2.5 px-3">
                            {[...rollingNews, ...rollingNews].map((article, idx) => (
                              <button
                                key={`${article.article_id}_${idx}`}
                                type="button"
                                onClick={() => submitPrompt(article.workflow_prompt)}
                                className="group flex w-[290px] shrink-0 flex-col justify-between rounded-[10px] border border-[#EAEAE7] bg-white p-2.5 text-left transition-all hover:border-[#171717] hover:shadow-xs sm:w-[320px]"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex min-w-0 items-center gap-1.5">
                                    <span
                                      style={{
                                        backgroundColor: article.publisher_bg_hex,
                                        color: article.publisher_fg_hex,
                                      }}
                                      className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[4px] font-mono text-[9px] font-bold"
                                    >
                                      {article.publisher_monogram}
                                    </span>
                                    <span className="truncate text-[10px] font-semibold text-[#626262]">
                                      {article.publisher_name}
                                    </span>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1">
                                    <span className="rounded bg-[#F5F5F4] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#171717]">
                                      {article.primary_ticker}
                                    </span>
                                    <span className="text-[10px] text-[#8E8E8C]">
                                      {article.published_label}
                                    </span>
                                  </div>
                                </div>
                                <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug font-semibold text-[#171717] group-hover:underline">
                                  {article.title}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ============================================================
                   * ACTIVE CONVERSATION TIMELINE (User Message -> Thinking -> Diagram)
                   * ============================================================ */
                  <>
                    <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
                      <div className="mx-auto max-w-[1260px] space-y-8">
                        {turns.map((turn) => (
                          <div id={turn.turnId} key={turn.turnId} className="space-y-4">
                            {/* User Prompt Bubble (Right-aligned like ChatGPT) */}
                            <div className="flex justify-end">
                              <div className="max-w-[80%] rounded-[20px] rounded-br-[6px] bg-[#171717] px-4 py-3 text-[14px] leading-relaxed font-medium text-white shadow-2xs">
                                {turn.userPrompt}
                              </div>
                            </div>

                            {/* Assistant Response Turn (Full-Width on Mobile, Indented on Desktop) */}
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3.5">
                              <div className="flex items-center gap-2 sm:mt-0.5 sm:block">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#171717] font-mono text-[10px] font-bold text-white">
                                  TP
                                </div>
                                <span className="text-[12px] font-semibold text-[#171717] sm:hidden">
                                  Tipping Point
                                </span>
                              </div>

                              <div className="min-w-0 flex-1 space-y-3.5">
                                {/* STAGE A: Thinking Process Accordion (Expands while streaming, collapses when done) */}
                                <ThinkingProcessAccordion
                                  steps={turn.response.thinking_steps}
                                  activeStepIndex={turn.activeStepIndex}
                                  autoPlatform={turn.response.auto_selected_platform}
                                  isStreaming={turn.isStreaming}
                                  totalMs={turn.response.total_thinking_ms}
                                  enabledPlatformsCount={enabledPlatformIds.length}
                                />

                                {/* STAGE B: Assistant Conversational Lead-In + Resulting Interactive Diagram */}
                                {!turn.isStreaming && (
                                  <div className="space-y-3.5">
                                    <p className="text-[14px] leading-relaxed text-[#171717]">
                                      {formatAssistantSummary(
                                        turn.response,
                                        enabledPlatformIds
                                      )}
                                    </p>

                                    {turn.response.outcome_mode ===
                                      "STRATEGY_WORKFLOW" &&
                                      turn.response.workflow_diagram && (
                                        <TradingWorkflowDiagramView
                                          diagram={turn.response.workflow_diagram}
                                          enabledPlatformIds={enabledPlatformIds}
                                          onOpenUserProfile={() =>
                                            setUserProfileOpen(true)
                                          }
                                          onChangePlatform={(pid) =>
                                            updateTurnCompilationInPlace(
                                              turn.turnId,
                                              turn.userPrompt,
                                              pid,
                                              turn.response.workflow_diagram?.action
                                                .notional_usd
                                            )
                                          }
                                          onChangeNotional={(notional) =>
                                            updateTurnCompilationInPlace(
                                              turn.turnId,
                                              turn.userPrompt,
                                              turn.response.workflow_diagram?.action
                                                .platform.platform_id,
                                              notional
                                            )
                                          }
                                          onActivateWorkflow={handleActivateWorkflow}
                                          onSimulateWorkflow={(wf) =>
                                            setTurns((prev) =>
                                              prev.map((item) =>
                                                item.turnId === turn.turnId
                                                  ? {
                                                      ...item,
                                                      simulationBanner: `✓ 90-Day Historical Backtest: ${wf.action.side} ${wf.action.symbol} across ${enabledPlatformIds.length} enabled platforms triggered 6 times · Win Rate 83.3% · Net Return +14.2%`,
                                                    }
                                                  : item
                                              )
                                            )
                                          }
                                          simulationBanner={turn.simulationBanner}
                                        />
                                      )}

                                    {turn.response.outcome_mode === "SMART_NOTICE" &&
                                      turn.response.notice_diagram && (
                                        <SmartNoticeDiagramView
                                          diagram={turn.response.notice_diagram}
                                          onArmNotice={handleArmNotice}
                                          onOpenDirectTrade={(sym) =>
                                            submitPrompt(
                                              `Buy $500 of ${sym} right now at market`
                                            )
                                          }
                                        />
                                      )}

                                    {turn.response.outcome_mode === "DIRECT_ACTION" &&
                                      turn.response.direct_trade_ticket && (
                                        <DirectTradeTicketView
                                          ticket={turn.response.direct_trade_ticket}
                                          enabledPlatformIds={enabledPlatformIds}
                                          onOpenUserProfile={() =>
                                            setUserProfileOpen(true)
                                          }
                                          onChangePlatform={(pid) =>
                                            updateTurnCompilationInPlace(
                                              turn.turnId,
                                              turn.userPrompt,
                                              pid,
                                              turn.response.direct_trade_ticket
                                                ?.notional_usd
                                            )
                                          }
                                          onChangeNotional={(notional) =>
                                            updateTurnCompilationInPlace(
                                              turn.turnId,
                                              turn.userPrompt,
                                              turn.response.direct_trade_ticket
                                                ?.platform.platform_id,
                                              notional
                                            )
                                          }
                                          onSubmitDirectTrade={handleSubmitDirectTrade}
                                        />
                                      )}

                                    {turn.response.outcome_mode ===
                                      "ASK_USER_CONFIRMATION" && (
                                      <ConfirmationDisambiguationView
                                        response={turn.response}
                                        onSelectProposal={
                                          handleConfirmationProposalClick
                                        }
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={threadEndRef} />
                      </div>
                    </div>

                    {/* Docked Bottom Chat Composer Bar for Follow-Up Questions */}
                    <div className="shrink-0 border-t border-[#EAEAE7] bg-white px-3 py-2.5 sm:px-6 sm:py-3">
                      <div className="mx-auto max-w-[1260px]">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            submitPrompt(composerText);
                          }}
                          className="flex items-center gap-2 rounded-[16px] border border-[#D9D9D6] bg-[#FBFBFA] px-3.5 py-2 shadow-2xs focus-within:border-[#171717] focus-within:bg-white"
                        >
                          <button
                            type="button"
                            onClick={() => setShowAllPromptsModal(true)}
                            title="Browse 24 example prompts"
                            className="shrink-0 rounded-full border border-[#DEDEDC] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#626262] hover:text-[#171717]"
                          >
                            Examples
                          </button>
                          <input
                            type="text"
                            value={composerText}
                            onChange={(e) => setComposerText(e.target.value)}
                            placeholder="Ask a follow-up or build another strategy..."
                            aria-label="Follow-up message"
                            className="min-w-0 flex-1 bg-transparent px-1 text-[16px] text-[#171717] placeholder:text-[#8A8A88] focus:outline-none sm:text-[14px]"
                          />
                          <button
                            type="submit"
                            disabled={!composerText.trim()}
                            aria-label="Send message"
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                              composerText.trim()
                                ? "bg-[#171717] text-white hover:bg-[#2E2E2E]"
                                : "bg-[#EAEAE7] text-[#8A8A88]"
                            }`}
                          >
                            <span className="text-[15px] font-bold leading-none">
                              ↑
                            </span>
                          </button>
                        </form>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Optional Collapsible Right-Hand Live Market News Drawer */}
              {showRightNewsDrawer && (
                <div className="hidden w-[380px] shrink-0 overflow-y-auto border-l border-[#EAEAE7] bg-[#FBFBFA] p-4 xl:block">
                  <MarketNewsFeedPanel
                    onTriggerPrompt={(prompt) => submitPrompt(prompt)}
                    compact={true}
                  />
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: MARKETS & FULL NEWS FEED */}
          {activeNav === "markets" && (
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <MarketNewsFeedPanel
                    onTriggerPrompt={(prompt) => submitPrompt(prompt)}
                    compact={false}
                  />
                </div>
                <div className="space-y-4 lg:col-span-5">
                  <div className="rounded-[14px] border border-[#EAEAE7] bg-white p-5 shadow-xs">
                    <h2 className="text-[16px] font-bold text-[#171717]">
                      Live Multi-Asset Watchlist
                    </h2>
                    <p className="mt-1 text-[12px] text-[#626262]">
                      Click any asset to start a strategy conversation with automatic venue routing.
                    </p>
                    <div className="mt-4 divide-y divide-[#EAEAE7]">
                      {[
                        {
                          sym: "NVDA",
                          name: "NVIDIA Corp.",
                          price: "$211.11",
                          chg: "+4.16%",
                          plat: PLATFORM_REGISTRY.plat_alpaca,
                          wf: "Buy NVDA when AI news is bullish",
                        },
                        {
                          sym: "BTC-USD",
                          name: "Bitcoin Spot",
                          price: "$91,420.00",
                          chg: "+3.84%",
                          plat: PLATFORM_REGISTRY.plat_coinbase,
                          wf: "If Bitcoin breaks above $95,000 on positive ETF inflow news, buy $1,000 BTC",
                        },
                        {
                          sym: "ETH-PERP",
                          name: "Ethereum Perpetual",
                          price: "$3,242.50",
                          chg: "+2.71%",
                          plat: PLATFORM_REGISTRY.plat_hyperliquid,
                          wf: "Long $2,000 ETH at 3x leverage whenever ETH drops 5% in 1 hour and rebounds",
                        },
                        {
                          sym: "FED-CUT-25BPS-YES",
                          name: "Fed 25bps Rate Cut (YES)",
                          price: "68¢",
                          chg: "+6.25%",
                          plat: PLATFORM_REGISTRY.plat_polymarket,
                          wf: "Buy $300 of Fed Rate Cut YES shares if US CPI inflation comes in below 2.5%",
                        },
                        {
                          sym: "GLD",
                          name: "SPDR Gold Trust",
                          price: "$254.60",
                          chg: "+1.55%",
                          plat: PLATFORM_REGISTRY.plat_ibkr,
                          wf: "Whenever Gold rises 1.5% on geopolitical tension news, buy $500 of GLD",
                        },
                      ].map((row) => (
                        <div
                          key={row.sym}
                          className="flex items-center justify-between gap-3 py-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <PlatformBrandLogo platform={row.plat} size={28} />
                            <div>
                              <div className="text-[14px] font-bold text-[#171717]">
                                {row.sym}
                              </div>
                              <div className="text-[11px] text-[#626262]">
                                {row.name} · {row.plat.short_name}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right font-mono tabular-nums">
                              <div className="text-[14px] font-bold text-[#171717]">
                                {row.price}
                              </div>
                              <div className="text-[11px] font-semibold text-[#356B2B]">
                                {row.chg}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => submitPrompt(row.wf)}
                              className="rounded-[8px] bg-[#171717] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#2E2E2E]"
                            >
                              Automate
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: STRATEGIES INVENTORY */}
          {activeNav === "strategies" && (
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#171717]">
                      Active Strategies
                    </h2>
                    <p className="text-[13px] text-[#626262]">
                      Automated workflows monitoring live market and news feeds across your connected accounts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartNewChat}
                    className="inline-flex h-[36px] items-center gap-1.5 rounded-[8px] bg-[#171717] px-3.5 text-[12px] font-semibold text-white"
                  >
                    <CatalystIcon id="I09" size={15} />
                    <span>New Strategy</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {strategies.map((strat) => (
                    <div
                      key={strat.strategy_id}
                      className="rounded-[14px] border border-[#EAEAE7] bg-white p-5 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <PlatformBrandLogo platform={strat.platform} size={36} />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-[15px] font-bold text-[#171717]">
                                {strat.title}
                              </h3>
                              <span className="rounded-full bg-[#E8F1E6] px-2.5 py-0.5 text-[11px] font-semibold text-[#356B2B]">
                                {strat.status}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[12px] text-[#626262]">
                              &ldquo;{strat.thesis_summary}&rdquo;
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 rounded-[10px] bg-[#FBFBFA] p-3 text-[12px]">
                        <div>
                          <div className="text-[11px] text-[#626262]">Account &amp; Asset</div>
                          <div className="font-bold text-[#171717]">
                            {strat.platform.short_name} · {strat.symbol}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#626262]">Order Size</div>
                          <div className="font-mono font-bold text-[#171717] tabular-nums">
                            ${strat.allocated_budget_usd}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#626262]">Performance</div>
                          <div className="font-mono font-bold text-[#356B2B] tabular-nums">
                            {strat.unitized_pnl_pct} ({strat.unitized_pnl_usd})
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[#EAEAE7] pt-3">
                        <span className="text-[11px] text-[#626262]">
                          {strat.last_evaluated_label}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setStrategies((prev) =>
                                prev.map((s) =>
                                  s.strategy_id === strat.strategy_id
                                    ? {
                                        ...s,
                                        status:
                                          s.status === "Paused" ? "Paper active" : "Paused",
                                        authorization_epoch: s.authorization_epoch + 1,
                                      }
                                    : s
                                )
                              );
                            }}
                            className="inline-flex h-[32px] items-center gap-1 rounded-[8px] border border-[#DEDEDC] bg-white px-2.5 text-[11px] font-semibold text-[#171717] hover:bg-[#F5F5F4]"
                          >
                            <CatalystIcon
                              id={strat.status === "Paused" ? "I13" : "I14"}
                              size={13}
                            />
                            <span>
                              {strat.status === "Paused" ? "Resume" : "Pause"}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => submitPrompt(strat.thesis_summary)}
                            className="inline-flex h-[32px] items-center gap-1 rounded-[8px] bg-[#171717] px-3 text-[11px] font-semibold text-white"
                          >
                            <span>Open in Chat</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: PORTFOLIO */}
          {activeNav === "portfolio" && (
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              <div className="space-y-5">
                <div>
                  <h2 className="text-[20px] font-bold text-[#171717]">
                    Portfolio Overview
                  </h2>
                  <p className="text-[13px] text-[#626262]">
                    Consolidated balances, active strategy reservations, and holdings across all 16 connected accounts.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    {
                      label: "Total Equity",
                      val: `$${portfolio.total_equity_usd}`,
                      sub: "Across 16 Connected Accounts",
                    },
                    {
                      label: "Available Cash",
                      val: `$${portfolio.available_spendable_usd}`,
                      sub: "Ready for New Strategies",
                    },
                    {
                      label: "Reserved by Strategies",
                      val: `$${portfolio.reserved_funds_usd}`,
                      sub: "Locked for Active Rules",
                    },
                    {
                      label: "Open Positions",
                      val: `$${portfolio.marked_holdings_usd}`,
                      sub: "Live Market Valuation",
                    },
                    {
                      label: "Total Return",
                      val: portfolio.unitized_twr_pct,
                      sub: `Realized: ${portfolio.realized_pnl_usd}`,
                      positive: true,
                    },
                  ].map((card, idx) => (
                    <div
                      key={idx}
                      className="rounded-[14px] border border-[#EAEAE7] bg-white p-4 shadow-xs"
                    >
                      <div className="text-[11px] font-semibold text-[#626262]">
                        {card.label}
                      </div>
                      <div
                        className={`mt-1.5 font-mono text-[22px] font-bold tabular-nums ${
                          card.positive ? "text-[#356B2B]" : "text-[#171717]"
                        }`}
                      >
                        {card.val}
                      </div>
                      <div className="mt-1 text-[11px] text-[#626262]">{card.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: ACTIVITY & RECEIPTS */}
          {activeNav === "activity" && (
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-3 lg:col-span-7">
                  <h2 className="text-[20px] font-bold text-[#171717]">
                    Execution Activity &amp; Receipts
                  </h2>
                  {receipts.map((rcpt) => {
                    const active = selectedReceipt?.receipt_id === rcpt.receipt_id;
                    return (
                      <button
                        key={rcpt.receipt_id}
                        type="button"
                        onClick={() => setSelectedReceipt(rcpt)}
                        className={`flex w-full items-start justify-between gap-3 rounded-[14px] border p-4 text-left transition-all ${
                          active
                            ? "border-[#171717] bg-[#FBFBFA] shadow-xs"
                            : "border-[#EAEAE7] bg-white hover:border-[#171717]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <PlatformBrandLogo platform={rcpt.platform} size={32} />
                          <div>
                            <div className="text-[14px] font-bold text-[#171717]">
                              {rcpt.title}
                            </div>
                            <div className="mt-0.5 text-[12px] text-[#626262]">
                              {rcpt.subtitle}
                            </div>
                            <div className="mt-1.5 flex items-center gap-2 font-mono text-[11px] text-[#626262]">
                              <span>{rcpt.order_state}</span>
                            </div>
                          </div>
                        </div>
                        <span className="font-mono text-[13px] font-bold text-[#171717] tabular-nums">
                          ${rcpt.notional_usd}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="lg:col-span-5">
                  {selectedReceipt && (
                    <div className="rounded-[14px] border border-[#171717] bg-white p-5 shadow-xs">
                      <div className="flex items-center justify-between border-b border-[#EAEAE7] pb-3">
                        <span className="text-[12px] font-bold text-[#171717] uppercase">
                          Execution Receipt
                        </span>
                        <span className="rounded-full bg-[#E8F1E6] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#356B2B]">
                          {selectedReceipt.environment}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2 text-[12px]">
                        <div className="flex justify-between">
                          <span className="text-[#626262]">Venue:</span>
                          <span className="font-semibold">
                            {selectedReceipt.platform.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#626262]">Order Reference:</span>
                          <span className="font-mono font-semibold">
                            {selectedReceipt.client_order_id}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 rounded-[10px] bg-[#FBFBFA] p-3 text-[12px]">
                        <div className="font-semibold text-[#171717]">
                          Market Snapshot at Execution:
                        </div>
                        <p className="mt-0.5 text-[#626262]">
                          {selectedReceipt.evidence_summary}
                        </p>
                      </div>

                      {selectedReceipt.postings.length > 0 && (
                        <div className="mt-4">
                          <div className="mb-2 text-[11px] font-bold text-[#626262] uppercase">
                            Account Ledger Entries:
                          </div>
                          <div className="space-y-1.5">
                            {selectedReceipt.postings.map((p, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between rounded-[8px] border border-[#EAEAE7] px-3 py-2 font-mono text-[11px]"
                              >
                                <span className="truncate text-[#171717]">
                                  {p.account_code}
                                </span>
                                <span
                                  className={`font-bold ${
                                    p.side === "DEBIT"
                                      ? "text-[#356B2B]"
                                      : "text-[#171717]"
                                  }`}
                                >
                                  {p.side} ${p.amount_usd}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 6: SMART ALERTS */}
          {activeNav === "alerts" && (
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              <div className="space-y-4">
                <h2 className="text-[20px] font-bold text-[#171717]">
                  Active Smart Alerts
                </h2>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {alerts.map((alt) => (
                    <div
                      key={alt.alert_id}
                      className="rounded-[14px] border border-[#EAEAE7] bg-white p-4 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <PlatformBrandLogo platform={alt.action.platform} size={28} />
                          <div>
                            <h3 className="text-[14px] font-bold text-[#171717]">
                              {alt.title}
                            </h3>
                            <p className="text-[12px] text-[#626262]">
                              {alt.trigger.headline_condition}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-[#E8F1E6] px-2.5 py-0.5 text-[11px] font-bold text-[#356B2B]">
                          Active
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-[#EAEAE7] pt-2.5 text-[11px] text-[#626262]">
                        <span>Delivery: {alt.action.channels.join(", ")}</span>
                        <span>Frequency: {alt.action.cooldown}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 7: CONNECTED PLATFORMS & USER PROFILE TOGGLES */}
          {activeNav === "connections" && (
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#171717]">
                      User Profile · Connected Trading Platforms ({enabledPlatformIds.length}/16 Enabled)
                    </h2>
                    <p className="text-[13px] text-[#626262]">
                      By default, all 16 platforms are enabled. Catalyst generates execution legs across all platforms and hides any platform you disable below.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEnabledPlatformIds(ALL_PLATFORM_IDS)}
                      className="rounded-lg border border-[#DEDEDC] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#171717] hover:bg-[#F5F5F4]"
                    >
                      Enable All (16)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEnabledPlatformIds([
                          "plat_alpaca",
                          "plat_ibkr",
                          "plat_robinhood",
                          "plat_schwab",
                          "plat_tradier",
                        ])
                      }
                      className="rounded-lg border border-[#DEDEDC] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#171717] hover:bg-[#F5F5F4]"
                    >
                      Stocks &amp; ETFs Only (5)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEnabledPlatformIds([
                          "plat_coinbase",
                          "plat_binance",
                          "plat_kraken",
                          "plat_okx",
                          "plat_bybit",
                          "plat_hyperliquid",
                          "plat_dydx",
                          "plat_uniswap",
                        ])
                      }
                      className="rounded-lg border border-[#DEDEDC] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#171717] hover:bg-[#F5F5F4]"
                    >
                      Tokens &amp; DEX Only (8)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                  {listAllPlatforms().map((plat) => {
                    const isEnabled = enabledPlatformIds.includes(plat.platform_id);
                    return (
                      <div
                        key={plat.platform_id}
                        className={`flex flex-col justify-between rounded-[14px] border p-4 transition-all ${
                          isEnabled
                            ? "border-[#EAEAE7] bg-white shadow-xs"
                            : "border-dashed border-[#DEDEDC] bg-[#F8F8F7] opacity-65"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <PlatformBrandLogo platform={plat} size={36} />
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isEnabled}
                              onClick={() => togglePlatformEnabled(plat.platform_id)}
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                                isEnabled
                                  ? "bg-[#E8F1E6] text-[#356B2B]"
                                  : "bg-[#EAEAE7] text-[#626262]"
                              }`}
                            >
                              <span>{isEnabled ? "● Enabled" : "○ Disabled (Hidden)"}</span>
                            </button>
                          </div>
                          <h3 className="mt-3 text-[14px] font-bold text-[#171717]">
                            {plat.name}
                          </h3>
                          <p className="text-[11px] font-medium text-[#626262]">
                            {plat.category} · {plat.venue_label}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {plat.supported_asset_classes.map((cls) => (
                              <span
                                key={cls}
                                className="rounded bg-[#F5F5F4] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#626262]"
                              >
                                {cls}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 border-t border-[#EAEAE7] pt-2.5 text-[11px]">
                          <div className="flex justify-between text-[#626262]">
                            <span>Buying Power:</span>
                            <span className="font-mono font-bold text-[#171717] tabular-nums">
                              ${plat.available_balance_usd}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* USER PROFILE & PLATFORM ENABLE/DISABLE MODAL */}
      {userProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[88vh] w-full max-w-[860px] flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAEAE7] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#171717] font-mono text-[14px] font-bold text-white">
                  U
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[16px] font-bold text-[#171717]">
                      User Profile · Trading Platforms
                    </h2>
                    <span className="rounded-full bg-[#E8F1E6] px-2.5 py-0.5 text-[11px] font-bold text-[#26531E]">
                      {enabledPlatformIds.length} of 16 Enabled
                    </span>
                  </div>
                  <p className="text-[12px] text-[#626262]">
                    All 16 platforms are enabled by default. Catalyst generates all platforms and hides any platform you disable here.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUserProfileOpen(false)}
                aria-label="Close User Profile"
                className="rounded-full p-1.5 text-[#626262] hover:bg-[#F5F5F4] hover:text-[#171717]"
              >
                <CatalystIcon id="I18" size={18} />
              </button>
            </div>

            {/* Quick Bulk Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAEAE7] bg-[#FBFBFA] px-6 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setEnabledPlatformIds(ALL_PLATFORM_IDS)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                    enabledPlatformIds.length === 16
                      ? "bg-[#171717] text-white"
                      : "border border-[#DEDEDC] bg-white text-[#171717] hover:bg-[#F5F5F4]"
                  }`}
                >
                  Enable All (16 Default)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEnabledPlatformIds([
                      "plat_alpaca",
                      "plat_ibkr",
                      "plat_robinhood",
                      "plat_schwab",
                      "plat_tradier",
                    ])
                  }
                  className="rounded-full border border-[#DEDEDC] bg-white px-3 py-1 text-[11px] font-semibold text-[#171717] hover:bg-[#F5F5F4]"
                >
                  Stocks &amp; ETFs Only (5)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEnabledPlatformIds([
                      "plat_coinbase",
                      "plat_binance",
                      "plat_kraken",
                      "plat_okx",
                      "plat_bybit",
                      "plat_hyperliquid",
                      "plat_dydx",
                      "plat_uniswap",
                    ])
                  }
                  className="rounded-full border border-[#DEDEDC] bg-white px-3 py-1 text-[11px] font-semibold text-[#171717] hover:bg-[#F5F5F4]"
                >
                  Tokens &amp; Onchain DEX Only (8)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEnabledPlatformIds([
                      "plat_polymarket",
                      "plat_kalshi",
                      "plat_forecastex",
                    ])
                  }
                  className="rounded-full border border-[#DEDEDC] bg-white px-3 py-1 text-[11px] font-semibold text-[#171717] hover:bg-[#F5F5F4]"
                >
                  Prediction Markets Only (3)
                </button>
              </div>

              <span className="text-[11px] font-medium text-[#626262]">
                Disabled platforms are immediately hidden from diagrams
              </span>
            </div>

            {/* Grouped 16 Platforms with Toggle Switches */}
            <div className="space-y-5 overflow-y-auto p-6">
              {PLATFORM_GROUPS.map((group) => (
                <div key={group.groupTitle}>
                  <div className="mb-2.5 flex items-center justify-between">
                    <div>
                      <h3 className="text-[13px] font-bold text-[#171717]">
                        {group.groupTitle}
                      </h3>
                      <p className="text-[11px] text-[#626262]">
                        {group.groupSubtitle}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {group.platformIds.map((pid) => {
                      const plat = PLATFORM_REGISTRY[pid];
                      if (!plat) return null;
                      const isEnabled = enabledPlatformIds.includes(pid);
                      return (
                        <button
                          key={pid}
                          type="button"
                          onClick={() => togglePlatformEnabled(pid)}
                          className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all ${
                            isEnabled
                              ? "border-[#171717] bg-white shadow-2xs"
                              : "border-[#E5E5E2] bg-[#F8F8F7] opacity-60 hover:opacity-90"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <PlatformBrandLogo platform={plat} size={30} />
                            <div className="min-w-0">
                              <div className="truncate text-[13px] font-bold text-[#171717]">
                                {plat.name}
                              </div>
                              <div className="truncate text-[11px] text-[#626262]">
                                {plat.venue_label}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              isEnabled
                                ? "bg-[#E8F1E6] text-[#26531E]"
                                : "bg-[#EAEAE7] text-[#626262]"
                            }`}
                          >
                            {isEnabled ? "Enabled" : "Hidden"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-[#EAEAE7] bg-[#FBFBFA] px-6 py-3.5">
              <span className="text-[12px] text-[#626262]">
                {enabledPlatformIds.length} platforms active ·{" "}
                {16 - enabledPlatformIds.length} hidden
              </span>
              <button
                type="button"
                onClick={() => setUserProfileOpen(false)}
                className="rounded-lg bg-[#171717] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#2E2E2E]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMPT LIBRARY MODAL (All 24 Examples Organized Cleanly) */}
      {showAllPromptsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[85vh] w-full max-w-[820px] flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAEAE7] px-6 py-4">
              <div>
                <h2 className="text-[16px] font-bold text-[#171717]">
                  Example Prompts
                </h2>
                <p className="text-[12px] text-[#626262]">
                  Select any prompt below to watch the thinking progress and generated workflow, alert, or trade ticket.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllPromptsModal(false)}
                className="rounded-full p-1.5 text-[#626262] hover:bg-[#F5F5F4] hover:text-[#171717]"
              >
                <CatalystIcon id="I18" size={18} />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 border-b border-[#EAEAE7] bg-[#FBFBFA] px-6 py-3">
              {STARTER_CATEGORY_TABS.map((tab) => {
                const active = starterCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStarterCategory(tab.id)}
                    className={`rounded-full px-3.5 py-1 text-[12px] font-semibold transition-colors ${
                      active
                        ? "bg-[#171717] text-white"
                        : "bg-white text-[#626262] hover:text-[#171717]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-2.5 overflow-y-auto p-6 sm:grid-cols-2">
              {starterExamples.map((ex) => {
                const plat =
                  PLATFORM_REGISTRY[ex.auto_platform_id] ||
                  PLATFORM_REGISTRY.plat_alpaca;
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => submitPrompt(ex.query)}
                    className="flex items-start gap-3 rounded-[12px] border border-[#EAEAE7] bg-white p-3.5 text-left transition-all hover:border-[#171717] hover:bg-[#FBFBFA]"
                  >
                    <PlatformBrandLogo platform={plat} size={28} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] leading-snug font-semibold text-[#171717]">
                        {ex.query}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-[#626262]">
                        <span>Auto-routed to {plat.short_name}</span>
                        <span className="font-mono font-semibold text-[#171717]">
                          {ex.symbol}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER QUICK TRADE DRAWER */}
      {quickTradeOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/35">
          <div className="flex h-full w-full max-w-[420px] flex-col justify-between bg-white p-5 shadow-2xl">
            <div className="overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#EAEAE7] pb-3.5">
                <div className="flex items-center gap-2">
                  <CatalystIcon id="I24" size={18} />
                  <h2 className="text-[16px] font-bold text-[#171717]">
                    Quick Trade
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickTradeOpen(false)}
                  aria-label="Close Quick Trade"
                  className="rounded-full p-1 text-[#626262] hover:bg-[#F5F5F4] hover:text-[#171717]"
                >
                  <CatalystIcon id="I18" size={18} />
                </button>
              </div>

              <p className="mt-3 text-[12px] text-[#626262]">
                Select an instant order below or type any trade in the chatbox:
              </p>

              <div className="mt-3 space-y-2.5">
                {QUERY_EXAMPLES_MATRIX.filter((e) => e.category === "DIRECT_ACTION").map(
                  (ex) => {
                    const plat =
                      PLATFORM_REGISTRY[ex.auto_platform_id] ||
                      PLATFORM_REGISTRY.plat_alpaca;
                    return (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => {
                          setQuickTradeOpen(false);
                          submitPrompt(ex.query);
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-[12px] border border-[#EAEAE7] bg-[#FBFBFA] p-3 text-left hover:border-[#171717] hover:bg-white"
                      >
                        <div className="flex items-center gap-2.5">
                          <PlatformBrandLogo platform={plat} size={28} />
                          <div>
                            <div className="text-[13px] font-bold text-[#171717]">
                              {ex.short_label}
                            </div>
                            <div className="text-[11px] text-[#626262]">
                              {plat.name}
                            </div>
                          </div>
                        </div>
                        <span className="text-[12px] font-bold text-[#171717]">→</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="border-t border-[#EAEAE7] pt-3 text-[11px] text-[#626262]">
              Orders route directly to your connected brokerage or exchange.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
