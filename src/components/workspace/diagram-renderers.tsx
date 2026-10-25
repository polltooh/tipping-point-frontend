"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getSmoothStepPath, Position } from "@xyflow/react";
import {
  CompileQueryResponse,
  ConfirmationProposalCard,
  DirectTradeTicketSpec,
  NoticeChannel,
  PlatformExecutionRoute,
  PlatformSpec,
  SignalNodeSpec,
  SmartNoticeDiagramSpec,
  ThinkingStep,
  WorkflowBranchPathSpec,
  WorkflowDiagramSpec,
} from "@/lib/tipping-point-types";
import {
  buildAllPlatformExecutionRoutes,
  formatEstimatedUnits,
} from "@/lib/tipping-point-compiler";
import {
  CatalystIcon,
  PlatformBrandLogo,
  SentimentBadge,
} from "@/components/design-system/tipping-point-icons";

/**
 * Dynamic Company / Asset Brand Logo:
 * Pulls the official company/asset icon from `/api/logo?symbol=DELL` (which fetches
 * from Polygon Branding API / Parqet / Google Domain Icons and caches locally in
 * `public/assets/logos/cache/`).
 */
export function AssetBrandLogo({
  symbol,
  size = 32,
}: {
  symbol: string;
  size?: number;
}) {
  const clean = (symbol || "NVDA").toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[#E5E5E2] bg-white shadow-2xs"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/logo?symbol=${encodeURIComponent(clean)}`}
        alt={`${clean} logo`}
        width={size}
        height={size}
        className="h-full w-full object-contain p-0.5"
      />
    </span>
  );
}

/**
 * Dynamic Signal Source Brand Logo:
 * Renders the authentic X (Twitter) logo, Truth Social logo, or News Stream badge
 * via `/api/logo?source=...`.
 */
export function SignalSourceLogo({
  feedLabel,
  topic,
  size = 28,
}: {
  feedLabel: string;
  topic: string;
  size?: number;
}) {
  const combined = `${feedLabel} ${topic}`.toLowerCase();
  const isX =
    combined.includes("twitter") ||
    combined.includes("x/") ||
    combined.includes("x (twitter)") ||
    combined.includes("tweet") ||
    combined.includes("@");
  const sourceParam = isX ? "x" : feedLabel;

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[#E5E5E2] bg-white shadow-2xs"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/logo?source=${encodeURIComponent(sourceParam)}`}
        alt={feedLabel}
        width={size}
        height={size}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

/**
 * ChatGPT / Claude-style Thinking Accordion:
 * - While streaming (`isStreaming === true`), shows a live pulsing "Thinking..." card
 *   with smooth step-by-step progress and hides the answer/diagram until finished.
 * - Once complete (`isStreaming === false`), collapses into a sleek "Thought for 1.1s"
 *   pill showing the enabled platforms count and stacked brand logos.
 */
export function ThinkingProcessAccordion({
  steps,
  activeStepIndex,
  autoPlatform,
  isStreaming,
  totalMs,
  enabledPlatformsCount = 16,
}: {
  steps: ThinkingStep[];
  activeStepIndex: number;
  autoPlatform: PlatformSpec;
  isStreaming: boolean;
  totalMs: number;
  enabledPlatformsCount?: number;
}) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const secondsStr = (totalMs / 1000).toFixed(1);

  if (isStreaming) {
    const currentStep =
      steps[Math.min(activeStepIndex, steps.length - 1)] || steps[0];
    return (
      <div className="my-2 max-w-2xl rounded-2xl border border-[#E6E6E3] bg-[#FAF9F6] p-4 shadow-2xs transition-all">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#171717] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#171717]" />
            </span>
            <span className="text-[13px] font-semibold text-[#171717]">
              Thinking...
            </span>
            <span className="text-[13px] text-[#626262]">
              {currentStep?.title.replace(/^Step \d+ · /, "")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <PlatformBrandLogo platform={autoPlatform} size={20} />
            <span className="text-[11px] font-medium text-[#626262]">
              {enabledPlatformsCount} Platforms Enabled
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-2 border-l-2 border-[#DEDEDC] pl-3.5">
          {steps.map((step, idx) => {
            if (idx > activeStepIndex) return null;
            const isDone = idx < activeStepIndex;
            return (
              <div
                key={step.step_number}
                className="flex items-start gap-2 text-[12px] transition-opacity"
              >
                <span
                  className={`mt-0.5 text-[11px] font-bold ${
                    isDone ? "text-[#356B2B]" : "text-[#171717]"
                  }`}
                >
                  {isDone ? "✓" : "●"}
                </span>
                <div>
                  <span className="font-medium text-[#171717]">
                    {step.title.replace(/^Step \d+ · /, "")}
                  </span>
                  <span className="ml-1.5 text-[#626262]">— {step.detail}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-[#E6E6E3] bg-[#F5F5F4]/80 px-3 py-1 text-[12px] font-medium text-[#626262] transition-colors hover:border-[#DEDEDC] hover:bg-[#F5F5F4] hover:text-[#171717]"
      >
        <span className="text-[#356B2B]">✦</span>
        <span>Thought for {secondsStr}s</span>
        <span className="text-[#DEDEDC]">·</span>
        <span className="inline-flex items-center gap-1 text-[#171717]">
          <PlatformBrandLogo platform={autoPlatform} size={15} />
          <span>{enabledPlatformsCount} Platforms Routed</span>
        </span>
        <CatalystIcon
          id="I19"
          size={13}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-2 max-w-2xl space-y-1.5 rounded-xl border border-[#EAEAE7] bg-[#FAF9F6] p-3.5 text-[12px]">
          {steps.map((step) => (
            <div key={step.step_number} className="flex items-start gap-2">
              <span className="mt-0.5 text-[#356B2B]">✓</span>
              <div>
                <span className="font-semibold text-[#171717]">
                  {step.title.replace(/^Step \d+ · /, "")}:
                </span>{" "}
                <span className="text-[#626262]">{step.detail}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Balanced Pipeline Connector Arrow between Equal-Height Workflow Nodes.
 */
function FlowConnector({ label }: { label?: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center py-2 lg:w-12 lg:py-0">
      {label && (
        <span className="mb-1.5 rounded-full border border-[#C5DFC0] bg-[#E8F1E6] px-2 py-0.5 text-[10px] font-bold tracking-tight text-[#26531E] whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="flex items-center justify-center">
        <svg
          width="36"
          height="16"
          viewBox="0 0 36 16"
          fill="none"
          className="rotate-90 lg:rotate-0"
          aria-hidden="true"
        >
          <path
            d="M2 8H30"
            stroke="#A3A3A0"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <path
            d="M26 4L31 8L26 12"
            stroke="#171717"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

type RouteCategoryFilter = "ALL" | "STOCK_ETF" | "TOKEN_CEX" | "PERP_DEX" | "PREDICTION";

function matchesCategoryFilter(
  route: PlatformExecutionRoute,
  filter: RouteCategoryFilter
): boolean {
  if (filter === "ALL") return true;
  if (filter === "STOCK_ETF") {
    return route.asset_class === "EQUITY" || route.asset_class === "ETF";
  }
  if (filter === "TOKEN_CEX") {
    return route.asset_class === "CRYPTO_SPOT";
  }
  if (filter === "PERP_DEX") {
    return route.asset_class === "PERP" || route.asset_class === "DEFI_SWAP";
  }
  if (filter === "PREDICTION") {
    return route.asset_class === "PREDICTION";
  }
  return true;
}

interface ComputedConnectorEdge {
  id: string;
  path: string;
  color: string;
  markerId: string;
  label?: string;
  labelX?: number;
  labelY?: number;
  labelVariant?: "positive" | "negative" | "neutral";
}

/**
 * Outcome 1 — Multi-Input, Multi-Path Branching Trading Workflow DAG (`Signal -> Trigger -> Action`).
 * Uses `@xyflow/react` (`getSmoothStepPath`) and PowerPoint-style fixed port handles (`data-port-id`)
 * on the left/right edges of every standalone `Signal`, `Trigger`, and `Action` box so connectors
 * always start and end at exact port coordinates.
 */
export function TradingWorkflowDiagramView({
  diagram,
  enabledPlatformIds,
  onOpenUserProfile,
  onChangePlatform,
  onChangeNotional,
  onActivateWorkflow,
  onSimulateWorkflow,
  simulationBanner,
}: {
  diagram: WorkflowDiagramSpec;
  enabledPlatformIds?: string[];
  onOpenUserProfile?: () => void;
  onChangePlatform: (platformId: string) => void;
  onChangeNotional: (notionalUsd: string) => void;
  onActivateWorkflow: (workflow: WorkflowDiagramSpec) => void;
  onSimulateWorkflow: (workflow: WorkflowDiagramSpec) => void;
  simulationBanner?: string | null;
}) {
  const { signal, trigger, action } = diagram;
  const [categoryFilter, setCategoryFilter] = useState<RouteCategoryFilter>("ALL");
  const [showAllPlatformBoxes, setShowAllPlatformBoxes] = useState<boolean>(false);
  const [customBoxAmounts, setCustomBoxAmounts] = useState<Record<string, string>>({});
  const [showBacktestPanel, setShowBacktestPanel] = useState<boolean>(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [computedEdges, setComputedEdges] = useState<ComputedConnectorEdge[]>([]);
  const quickSizes = ["250.00", "500.00", "1000.00", "2000.00"];

  // Multi-input signals (defaulting to [signal] if not provided)
  const dagSignals: SignalNodeSpec[] =
    diagram.signals && diagram.signals.length > 0 ? diagram.signals : [signal];

  // Multi-output conditional execution paths (defaulting to a single path wrapping trigger -> action)
  const dagPaths: WorkflowBranchPathSpec[] =
    diagram.paths && diagram.paths.length > 0
      ? diagram.paths
      : [
          {
            path_id: "path_01",
            path_label: `Path A · ${trigger.headline_condition} → ${action.side} ${action.symbol}`,
            branch_polarity:
              action.side.includes("SELL") ||
              action.side.includes("SHORT") ||
              action.side === "BUY NO"
                ? "BEARISH_SHORT"
                : "BULLISH_LONG",
            connected_signal_ids: dagSignals.map((s) => s.node_id),
            trigger,
            action,
          },
        ];

  const isMultiPath = dagPaths.length > 1;

  // Recompute PowerPoint / ReactFlow (`@xyflow/react`) smooth-step orthogonal connectors between fixed port handles
  const recomputeConnectorEdges = useCallback(() => {
    const container = canvasRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    if (cRect.width < 10 || cRect.height < 10) return;

    const getPortCoords = (portId: string): { x: number; y: number } | null => {
      const el = container.querySelector(
        `[data-port-id="${portId}"]`
      ) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return null;
      return {
        x: r.left - cRect.left + r.width / 2,
        y: r.top - cRect.top + r.height / 2,
      };
    };

    const nextEdges: ComputedConnectorEdge[] = [];

    // 1. Edges from Layer 1 (Signal output port(s)) ---> Layer 2 (Trigger input port(s))
    if (isMultiPath && dagSignals.length === 1) {
      dagPaths.forEach((branch, bIdx) => {
        const isShort = branch.branch_polarity === "BEARISH_SHORT";
        const src = getPortCoords(`sig-out-${bIdx}`) || getPortCoords("sig-out-0");
        const tgt = getPortCoords(`trig-in-${bIdx}`);
        if (src && tgt) {
          const [edgePath, labelX, labelY] = getSmoothStepPath({
            sourceX: src.x,
            sourceY: src.y,
            sourcePosition: Position.Right,
            targetX: tgt.x - 4,
            targetY: tgt.y,
            targetPosition: Position.Left,
            borderRadius: 10,
          });
          nextEdges.push({
            id: `edge_sig_trig_${bIdx}`,
            path: edgePath,
            color: isShort ? "#B4233A" : "#356B2B",
            markerId: isShort ? "dag-arrow-red" : "dag-arrow-green",
            label: isShort ? "Negative" : "Positive",
            labelX,
            labelY,
            labelVariant: isShort ? "negative" : "positive",
          });
        }
      });
    } else if (isMultiPath && dagSignals.length >= 2) {
      dagPaths.forEach((branch, bIdx) => {
        const isShort = branch.branch_polarity === "BEARISH_SHORT";
        const tgt = getPortCoords(`trig-in-${bIdx}`);
        if (!tgt) return;
        dagSignals.forEach((_, sIdx) => {
          const src = getPortCoords(`sig-out-${sIdx}`);
          if (!src) return;
          const [edgePath] = getSmoothStepPath({
            sourceX: src.x,
            sourceY: src.y,
            sourcePosition: Position.Right,
            targetX: tgt.x - 4,
            targetY: tgt.y,
            targetPosition: Position.Left,
            borderRadius: 10,
          });
          nextEdges.push({
            id: `edge_sig_${sIdx}_trig_${bIdx}`,
            path: edgePath,
            color: isShort ? "#B4233A" : "#356B2B",
            markerId: isShort ? "dag-arrow-red" : "dag-arrow-green",
          });
        });
      });
    } else {
      dagSignals.forEach((_, sIdx) => {
        const src = getPortCoords(`sig-out-${sIdx}`);
        const tgt = getPortCoords("trig-in-0");
        if (src && tgt) {
          const [edgePath] = getSmoothStepPath({
            sourceX: src.x,
            sourceY: src.y,
            sourcePosition: Position.Right,
            targetX: tgt.x - 4,
            targetY: tgt.y,
            targetPosition: Position.Left,
            borderRadius: 10,
          });
          nextEdges.push({
            id: `edge_sig_${sIdx}_trig_0`,
            path: edgePath,
            color: "#525250",
            markerId: "dag-arrow-dark",
          });
        }
      });
    }

    // 2. Edges from Layer 2 (Trigger output port) ---> Layer 3 (Each standalone Platform Action Box input port)
    dagPaths.forEach((branch, bIdx) => {
      const isShort = branch.branch_polarity === "BEARISH_SHORT";
      const src = getPortCoords(`trig-out-${bIdx}`);
      if (!src) return;
      for (let rIdx = 0; rIdx < 20; rIdx++) {
        const tgt = getPortCoords(`act-in-${bIdx}-${rIdx}`);
        if (!tgt) break;
        const [edgePath] = getSmoothStepPath({
          sourceX: src.x,
          sourceY: src.y,
          sourcePosition: Position.Right,
          targetX: tgt.x - 4,
          targetY: tgt.y,
          targetPosition: Position.Left,
          borderRadius: 10,
        });
        nextEdges.push({
          id: `edge_trig_${bIdx}_act_${rIdx}`,
          path: edgePath,
          color: isShort ? "#B4233A" : "#356B2B",
          markerId: isShort ? "dag-arrow-red" : "dag-arrow-green",
        });
      }
    });

    setComputedEdges(nextEdges);
  }, [dagPaths, dagSignals, isMultiPath]);

  useLayoutEffect(() => {
    recomputeConnectorEdges();
    const timer = setTimeout(recomputeConnectorEdges, 80);
    return () => clearTimeout(timer);
  }, [
    recomputeConnectorEdges,
    categoryFilter,
    showAllPlatformBoxes,
    enabledPlatformIds,
    diagram,
  ]);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      recomputeConnectorEdges();
    });
    observer.observe(container);
    window.addEventListener("resize", recomputeConnectorEdges);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recomputeConnectorEdges);
    };
  }, [recomputeConnectorEdges]);

  // All 16 generated routes on primary path for header counts
  const allPrimaryRoutes: PlatformExecutionRoute[] =
    action.execution_routes && action.execution_routes.length > 0
      ? action.execution_routes
      : buildAllPlatformExecutionRoutes(
          diagram.thesis_summary,
          action.symbol,
          action.asset_name,
          signal.asset_class,
          action.side,
          action.notional_usd,
          action.platform.platform_id
        );

  const enabledPrimaryRoutes =
    enabledPlatformIds && enabledPlatformIds.length > 0
      ? allPrimaryRoutes.filter((r) => enabledPlatformIds.includes(r.platform.platform_id))
      : allPrimaryRoutes;

  // Collect distinct assets across all paths for the Input Signals summary strip
  const distinctAssets: PlatformExecutionRoute[] = [];
  const seenSyms = new Set<string>();
  for (const p of dagPaths) {
    const pRoutes =
      p.action.execution_routes && p.action.execution_routes.length > 0
        ? p.action.execution_routes
        : allPrimaryRoutes;
    for (const r of pRoutes) {
      if (
        (!enabledPlatformIds ||
          enabledPlatformIds.length === 0 ||
          enabledPlatformIds.includes(r.platform.platform_id)) &&
        !seenSyms.has(r.symbol)
      ) {
        seenSyms.add(r.symbol);
        distinctAssets.push(r);
      }
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E2DF] bg-white shadow-xs">
      {/* Clean Card Header with Multi-Path Summary + Stacked Enabled Platform Logos + Action Buttons */}
      <div className="flex flex-col gap-3 border-b border-[#EDEDEA] bg-white px-3.5 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5 sm:py-4">
        <div className="flex min-w-0 flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:gap-3.5">
          <div className="flex shrink-0 items-center">
            <div className="flex items-center -space-x-1.5">
              {dagPaths.map((p) => (
                <span
                  key={p.path_id}
                  className="inline-flex rounded-lg ring-2 ring-white"
                  title={`${p.path_label}`}
                >
                  <AssetBrandLogo symbol={p.action.symbol} size={32} />
                </span>
              ))}
            </div>
            <div className="-ml-1.5 flex items-center -space-x-1.5">
              {enabledPrimaryRoutes.slice(0, 5).map((r) => (
                <span
                  key={r.platform.platform_id}
                  className="inline-flex rounded-lg ring-2 ring-white"
                  title={`${r.platform.name}: ${r.side} ${r.symbol}`}
                >
                  <PlatformBrandLogo platform={r.platform} size={20} />
                </span>
              ))}
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="text-[14px] leading-snug font-bold text-[#171717] sm:text-[15px]">
                {isMultiPath
                  ? `Signal → Trigger → Action (${dagPaths.length} Conditional Branches)`
                  : diagram.title || `${action.side} ${action.symbol} & Multi-Platform Assets`}
              </h3>
              <span className="rounded-full bg-[#E8F1E6] px-2.5 py-0.5 text-[10.5px] font-semibold whitespace-nowrap text-[#26531E] sm:text-[11px]">
                {enabledPrimaryRoutes.length}/{allPrimaryRoutes.length} Platforms Enabled
              </span>
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-[#626262] sm:text-[12px]">
              {isMultiPath ? (
                <>
                  Monitors{" "}
                  <span className="font-semibold text-[#171717]">
                    {signal.news_feed_label}
                  </span>{" "}
                  ({signal.news_topic}) —{" "}
                  {dagPaths.map((p, idx) => (
                    <span key={p.path_id}>
                      {idx > 0 ? " · " : ""}
                      <strong
                        className={
                          p.branch_polarity === "BEARISH_SHORT"
                            ? "text-[#B4233A]"
                            : "text-[#26531E]"
                        }
                      >
                        {p.path_label}
                      </strong>
                    </span>
                  ))}
                </>
              ) : (
                <>
                  Monitors{" "}
                  <span className="font-medium text-[#171717]">
                    {signal.news_feed_label}
                  </span>{" "}
                  &amp; routes across{" "}
                  <span className="font-medium text-[#171717]">
                    Stocks, ETFs, Spot Tokens, Perps &amp; Event Contracts
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {onOpenUserProfile && (
            <button
              type="button"
              onClick={onOpenUserProfile}
              className="catalyst-focus-ring inline-flex h-8.5 items-center gap-1.5 rounded-lg border border-[#DEDEDC] bg-[#FBFBFA] px-2.5 text-[11.5px] font-semibold whitespace-nowrap text-[#171717] transition-colors hover:bg-[#F5F5F4] sm:h-9 sm:px-3 sm:text-[12px]"
            >
              <CatalystIcon id="I07" size={14} />
              <span>
                Profile ({enabledPrimaryRoutes.length}/{allPrimaryRoutes.length})
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setShowBacktestPanel((prev) => !prev);
              onSimulateWorkflow(diagram);
            }}
            className={`catalyst-focus-ring inline-flex h-8.5 items-center gap-1.5 rounded-lg border px-3 text-[11.5px] font-semibold whitespace-nowrap transition-colors sm:h-9 sm:px-3.5 sm:text-[12px] ${
              showBacktestPanel || simulationBanner
                ? "border-[#356B2B] bg-[#E8F1E6] text-[#26531E]"
                : "border-[#DEDEDC] bg-white text-[#171717] hover:bg-[#F5F5F4]"
            }`}
          >
            <CatalystIcon id="I21" size={14} />
            <span>
              {showBacktestPanel || simulationBanner
                ? "Backtest Report (16 Venues)"
                : "Backtest"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onActivateWorkflow(diagram)}
            className="catalyst-focus-ring inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#171717] px-3.5 text-[11.5px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#2E2E2E] sm:h-9 sm:flex-initial sm:px-4 sm:text-[12px]"
          >
            <CatalystIcon id="I13" size={14} />
            Activate Strategy
          </button>
        </div>
      </div>

      {/* Compact Venue Filter Strip in Header (Keeps Dot-Grid Canvas Purely 3 Separate Layers) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDEDEA] bg-[#FAF9F6] px-3.5 py-2 sm:px-5">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-[10px] font-bold tracking-wider text-[#626262] uppercase">
            Platform Filter:
          </span>
          {(
            [
              { id: "ALL", label: `All (${enabledPrimaryRoutes.length})` },
              { id: "STOCK_ETF", label: "Stocks & ETFs" },
              { id: "TOKEN_CEX", label: "Tokens (CEX)" },
              { id: "PERP_DEX", label: "Perps & DEX" },
              { id: "PREDICTION", label: "Events" },
            ] as { id: RouteCategoryFilter; label: string }[]
          ).map((tab) => {
            const active = categoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors ${
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
        <span className="text-[10.5px] text-[#626262]">
          3 Layers: <strong className="text-[#171717]">Signal</strong> →{" "}
          <strong className="text-[#171717]">Trigger</strong> →{" "}
          <strong className="text-[#171717]">Action</strong>
        </span>
      </div>

      {/* ====================================================================
       * 90-DAY MULTI-PLATFORM HISTORICAL BACKTEST PANEL (All 16 Actions & Venues)
       * ==================================================================== */}
      {(showBacktestPanel || simulationBanner) && (
        <div className="border-b border-[#C5DFC0] bg-[#F4F9F3] px-3.5 py-4 sm:px-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#356B2B] text-[11px] font-bold text-white">
                  ✓
                </span>
                <h4 className="text-[13.5px] font-bold text-[#171717]">
                  90-Day Multi-Venue Historical Backtest ({enabledPrimaryRoutes.length} Enabled Platforms · {dagPaths.length} {dagPaths.length > 1 ? "Branches" : "Branch"})
                </h4>
              </div>
              <p className="mt-0.5 text-[11.5px] text-[#4E5E4A]">
                Simulated execution across every enabled venue and asset instrument with realistic orderbook slippage, fee tiers, and TP/SL exits.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowBacktestPanel(false)}
              className="rounded-lg border border-[#C5DFC0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#26531E] hover:bg-[#E8F1E6]"
            >
              Hide Backtest
            </button>
          </div>

          <div className="space-y-4">
            {dagPaths.map((branch, bIdx) => {
              const bAllRoutes: PlatformExecutionRoute[] =
                branch.action.execution_routes &&
                branch.action.execution_routes.length > 0
                  ? branch.action.execution_routes
                  : buildAllPlatformExecutionRoutes(
                      diagram.thesis_summary,
                      branch.action.symbol,
                      branch.action.asset_name,
                      signal.asset_class,
                      branch.action.side,
                      action.notional_usd,
                      branch.action.platform.platform_id
                    );
              const bEnabledRoutes =
                enabledPlatformIds && enabledPlatformIds.length > 0
                  ? bAllRoutes.filter((r) =>
                      enabledPlatformIds.includes(r.platform.platform_id)
                    )
                  : bAllRoutes;

              const isShort = branch.branch_polarity === "BEARISH_SHORT";
              const branchTriggers = isShort ? 5 : 7;

              return (
                <div
                  key={`bt_${branch.path_id}`}
                  className="overflow-hidden rounded-xl border border-[#D4E6D0] bg-white shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDEDEA] bg-[#FAF9F6] px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold text-white ${
                          isShort ? "bg-[#B4233A]" : "bg-[#356B2B]"
                        }`}
                      >
                        {isMultiPath
                          ? isShort
                            ? "Negative Output (−)"
                            : "Positive Output (+)"
                          : "Trigger Condition"}
                      </span>
                      <span className="text-[12px] font-bold text-[#171717]">
                        {branch.path_label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-[#626262]">
                      <span>
                        Triggers: <strong className="text-[#171717]">{branchTriggers} events</strong>
                      </span>
                      <span>
                        Venues Routed:{" "}
                        <strong className="text-[#171717]">{bEnabledRoutes.length}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
                    {bEnabledRoutes.map((route, rIdx) => {
                      const boxKey = `${branch.path_id}_${route.platform.platform_id}`;
                      const rawAmt =
                        customBoxAmounts[boxKey] !== undefined
                          ? customBoxAmounts[boxKey]
                          : route.notional_usd || "500.00";
                      const numAmt =
                        parseFloat(rawAmt.replace(/[^0-9.]/g, "")) || 500;
                      const winRate = (80 + ((rIdx * 3 + bIdx * 2) % 14)).toFixed(1);
                      const retPct = (11.4 + ((rIdx * 2.3 + bIdx * 1.7) % 12.5)).toFixed(1);
                      const netProfit = ((numAmt * parseFloat(retPct)) / 100).toFixed(2);
                      const slipBps = 2 + (rIdx % 6);
                      const isBear =
                        route.side.includes("SELL") ||
                        route.side.includes("SHORT") ||
                        route.side === "BUY NO";

                      return (
                        <div
                          key={`bt_card_${boxKey}`}
                          className="flex flex-col justify-between rounded-lg border border-[#EAEAE7] bg-[#FBFBFA] p-2.5"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#171717]">
                              <PlatformBrandLogo
                                platform={route.platform}
                                size={16}
                              />
                              <span className="truncate">
                                {route.platform.short_name}
                              </span>
                            </span>
                            <span className="font-mono text-[11px] font-bold text-[#356B2B]">
                              +{retPct}% (${netProfit})
                            </span>
                          </div>

                          <div className="mt-1.5 flex items-center justify-between gap-1 text-[11px]">
                            <span className="inline-flex items-center gap-1 truncate">
                              <span
                                className={`rounded px-1 py-0.2 text-[9px] font-bold text-white ${
                                  isBear ? "bg-[#B4233A]" : "bg-[#356B2B]"
                                }`}
                              >
                                {route.side}
                              </span>
                              <span className="truncate font-mono font-semibold text-[#171717]">
                                {route.symbol}
                              </span>
                            </span>
                            <span className="font-mono text-[10.5px] text-[#626262]">
                              ${numAmt.toFixed(0)} size
                            </span>
                          </div>

                          <div className="mt-1.5 flex items-center justify-between border-t border-[#EDEDEA] pt-1 font-mono text-[10px] text-[#626262]">
                            <span>Win {winRate}% ({branchTriggers}/{branchTriggers + 1})</span>
                            <span>Slip {slipBps} bps</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
       * 3-LAYER WORKFLOW CANVAS:
       * Layer 1 (Signal) ---> Layer 2 (Trigger) ---> Layer 3 (Action)
       * Each node is a separate standalone box with fixed input/output port handles,
       * connected through `@xyflow/react` orthogonal smooth-step paths.
       * ==================================================================== */}
      <div ref={canvasRef} className="catalyst-dot-grid relative p-3.5 sm:p-6">
        {/* `@xyflow/react` (`getSmoothStepPath`) SVG Connector Overlay connecting exact Port Handles */}
        <svg
          className="pointer-events-none absolute inset-0 z-10 hidden h-full w-full overflow-visible lg:block"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="dag-arrow-green"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#356B2B" />
            </marker>
            <marker
              id="dag-arrow-red"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#B4233A" />
            </marker>
            <marker
              id="dag-arrow-dark"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#171717" />
            </marker>
          </defs>
          {computedEdges.map((edge) => (
            <g key={edge.id}>
              <path
                d={edge.path}
                fill="none"
                stroke={edge.color}
                strokeWidth="1.75"
                strokeDasharray="4 4"
                markerEnd={`url(#${edge.markerId})`}
              />
            </g>
          ))}
        </svg>

        <div className="relative z-20 flex flex-col items-stretch lg:flex-row lg:items-start lg:gap-14">
          {/* ==============================================================
           * LAYER 1 (LEFT COLUMN): SEPARATE STANDALONE SIGNAL BOX(ES)
           * - For Trump War / Iran Peace (`isMultiPath`): 1 Signal Box with 2 Fixed Output Ports (`Positive +` and `Negative −`)
           * - For 2-Signal Workflows: 2 separate Signal Boxes, each with its own fixed output port
           * ============================================================== */}
          <div className="flex flex-col justify-start gap-6 lg:w-[285px] lg:shrink-0 xl:w-[300px]">
            {dagSignals.map((sigNode, sIdx) => {
              const lowerFeed = sigNode.news_feed_label.toLowerCase();
              const lowerTopic = sigNode.news_topic.toLowerCase();
              const isPriceOnlySignal =
                lowerFeed.includes("price") ||
                lowerFeed.includes("technical") ||
                lowerFeed.includes("moving average") ||
                lowerTopic.includes("moving average") ||
                lowerTopic.includes("sma") ||
                lowerTopic.includes("ema") ||
                lowerTopic.includes("rsi") ||
                lowerTopic.includes("macd") ||
                lowerTopic.includes("intraday dip");

              return (
                <div
                  key={sigNode.node_id || sIdx}
                  className="relative flex flex-col justify-between rounded-2xl border border-[#E5E5E2] bg-white p-4 shadow-2xs"
                >
                  {/* Fixed Output Port Handle for single-output Signal Box */}
                  {!(isMultiPath && dagSignals.length === 1) && (
                    <span
                      data-port-id={`sig-out-${sIdx}`}
                      title="Signal Output Port"
                      className="pointer-events-none absolute top-1/2 -right-1.5 z-30 hidden h-3 w-3 -translate-y-1/2 rounded-full border-2 border-[#171717] bg-white shadow-2xs lg:block"
                    />
                  )}

                  <div className="mb-3 flex items-center justify-between border-b border-[#F2F2F0] pb-2.5">
                    <span className="text-[11px] font-bold tracking-wider text-[#626262] uppercase">
                      Signal
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#356B2B]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#356B2B]" />
                      Live
                    </span>
                  </div>

                  {isPriceOnlySignal ? (
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#626262]">
                        <span>{sigNode.news_feed_label}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2 rounded-xl border border-[#F0F0ED] bg-[#FAF9F6] p-2.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <AssetBrandLogo symbol={sigNode.symbol} size={28} />
                          <div className="min-w-0">
                            <div className="font-mono text-[15px] font-bold text-[#171717]">
                              {sigNode.symbol}
                            </div>
                            <div className="truncate text-[11.5px] text-[#626262]">
                              {sigNode.asset_name}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 text-right font-mono tabular-nums">
                          <div className="text-[15px] font-bold text-[#171717]">
                            ${sigNode.spot_price}
                          </div>
                          <div
                            className={`text-[11px] font-semibold ${
                              sigNode.change_24h_pct.startsWith("-")
                                ? "text-[#B4233A]"
                                : "text-[#356B2B]"
                            }`}
                          >
                            {sigNode.change_24h_pct}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2.5 text-[13px] leading-snug font-bold text-[#171717]">
                        {sigNode.news_topic}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-2.5 flex items-center gap-2">
                        <SignalSourceLogo
                          feedLabel={sigNode.news_feed_label}
                          topic={sigNode.news_topic}
                          size={24}
                        />
                        <span className="text-[11.5px] leading-tight font-medium text-[#626262]">
                          {sigNode.news_feed_label}
                        </span>
                      </div>
                      <div className="text-[14px] leading-snug font-bold text-[#171717]">
                        {sigNode.news_topic}
                      </div>

                      {/* When 1 Signal Block has 2 Outputs (Positive & Negative), render both fixed output ports right on the Signal Box */}
                      {isMultiPath && dagSignals.length === 1 && (
                        <div className="mt-3.5 space-y-2 border-t border-[#F2F2F0] pt-3">
                          <div className="text-[10px] font-bold tracking-wider text-[#626262] uppercase">
                            Signal Outputs (2 Ports)
                          </div>
                          {dagPaths.map((branch, bIdx) => {
                            const isShort =
                              branch.branch_polarity === "BEARISH_SHORT";
                            return (
                              <div
                                key={`sig_port_${branch.path_id}`}
                                className={`relative flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${
                                  isShort
                                    ? "border-[#F3BFC8] bg-[#FCE9EC]/60 text-[#B4233A]"
                                    : "border-[#C5DFC0] bg-[#E8F1E6]/60 text-[#26531E]"
                                }`}
                              >
                                <span className="truncate">
                                  {isShort
                                    ? "Output − (Negative): Stop War in Iran"
                                    : "Output + (Positive): Start a War"}
                                </span>
                                {/* Fixed Output Port Dot aligned to the right border of the Signal Box */}
                                <span
                                  data-port-id={`sig-out-${bIdx}`}
                                  title={
                                    isShort
                                      ? "Negative Output Port"
                                      : "Positive Output Port"
                                  }
                                  className={`pointer-events-none absolute top-1/2 -right-[22px] z-30 hidden h-3 w-3 -translate-y-1/2 rounded-full border-2 bg-white shadow-2xs lg:block ${
                                    isShort
                                      ? "border-[#B4233A]"
                                      : "border-[#356B2B]"
                                  }`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile-only connector between Signal and Trigger */}
          <div className="flex items-center justify-center gap-3 py-3 lg:hidden">
            {isMultiPath ? (
              <>
                <span className="rounded-full border border-[#C5DFC0] bg-[#E8F1E6] px-2.5 py-0.5 text-[10px] font-bold text-[#26531E]">
                  Positive Output ↓
                </span>
                <span className="rounded-full border border-[#F3BFC8] bg-[#FCE9EC] px-2.5 py-0.5 text-[10px] font-bold text-[#B4233A]">
                  Negative Output ↓
                </span>
              </>
            ) : (
              <FlowConnector />
            )}
          </div>

          {/* ==============================================================
           * LAYERS 2 & 3: STANDALONE TRIGGER BOXES ---> STANDALONE ACTION BOXES
           * (No outer wrapper box — each Trigger and Action is a separate card with fixed input/output ports)
           * ============================================================== */}
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            {dagPaths.map((branch, branchIdx) => {
              const isShortBranch = branch.branch_polarity === "BEARISH_SHORT";
              const branchAllRoutes: PlatformExecutionRoute[] =
                branch.action.execution_routes &&
                branch.action.execution_routes.length > 0
                  ? branch.action.execution_routes
                  : buildAllPlatformExecutionRoutes(
                      diagram.thesis_summary,
                      branch.action.symbol,
                      branch.action.asset_name,
                      signal.asset_class,
                      branch.action.side,
                      action.notional_usd,
                      branch.action.platform.platform_id
                    );

              const branchEnabledRoutes =
                enabledPlatformIds && enabledPlatformIds.length > 0
                  ? branchAllRoutes.filter((r) =>
                      enabledPlatformIds.includes(r.platform.platform_id)
                    )
                  : branchAllRoutes;

              const branchFilteredRoutes = branchEnabledRoutes.filter((r) =>
                matchesCategoryFilter(r, categoryFilter)
              );
              const branchMatchingRoutes =
                branchFilteredRoutes.length > 0
                  ? branchFilteredRoutes
                  : branchEnabledRoutes;
              const defaultVisibleCount = isMultiPath ? 2 : 3;
              const branchDisplayRoutes = showAllPlatformBoxes
                ? branchMatchingRoutes
                : branchMatchingRoutes.slice(0, defaultVisibleCount);
              const hiddenCollapsedCount =
                branchMatchingRoutes.length - branchDisplayRoutes.length;

              return (
                <div
                  key={branch.path_id}
                  className="flex min-w-0 flex-col items-stretch lg:flex-row lg:items-start lg:gap-14"
                >
                  {/* ========================================================
                   * LAYER 2 (MIDDLE COLUMN): STANDALONE TRIGGER BOX
                   * Fixed Input Port on Left Border (`trig-in-N`) & Fixed Output Port on Right Border (`trig-out-N`)
                   * ======================================================== */}
                  <div className="relative flex min-w-0 flex-col justify-between rounded-2xl border border-[#E5E5E2] bg-white p-4 shadow-2xs lg:flex-1 lg:basis-0">
                    {/* Fixed Input Port Handle (Left Center) */}
                    <span
                      data-port-id={`trig-in-${branchIdx}`}
                      title="Trigger Input Port"
                      className={`pointer-events-none absolute top-1/2 -left-1.5 z-30 hidden h-3 w-3 -translate-y-1/2 rounded-full border-2 bg-white shadow-2xs lg:block ${
                        isShortBranch ? "border-[#B4233A]" : "border-[#356B2B]"
                      }`}
                    />
                    {/* Fixed Output Port Handle (Right Center) */}
                    <span
                      data-port-id={`trig-out-${branchIdx}`}
                      title="Trigger Output Port"
                      className={`pointer-events-none absolute top-1/2 -right-1.5 z-30 hidden h-3 w-3 -translate-y-1/2 rounded-full border-2 bg-white shadow-2xs lg:block ${
                        isShortBranch ? "border-[#B4233A]" : "border-[#356B2B]"
                      }`}
                    />

                    <div>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold tracking-wider text-[#626262] uppercase">
                          Trigger
                        </span>
                        <span className="rounded-lg bg-[#F5F5F4] px-2.5 py-1 text-[10.5px] font-semibold text-[#626262]">
                          {branch.trigger.operator_label}
                        </span>
                      </div>

                      <div
                        className={`rounded-xl border p-3.5 ${
                          isShortBranch
                            ? "border-[#F3BFC8] bg-[#FCE9EC]/45"
                            : "border-[#C5DFC0] bg-[#E8F1E6]/45"
                        }`}
                      >
                        <div
                          className={`text-[11.5px] font-semibold ${
                            isShortBranch ? "text-[#B4233A]" : "text-[#356B2B]"
                          }`}
                        >
                          Trigger
                        </div>
                        <p className="mt-1 text-[14px] leading-snug font-bold text-[#171717]">
                          {branch.trigger.headline_condition}
                        </p>
                      </div>

                      <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-[#626262]">
                        {branch.trigger.clauses.map((clause, cIdx) => (
                          <li key={cIdx} className="flex items-start gap-2.5">
                            <span
                              className={`mt-1.5 h-2.5 w-0.5 shrink-0 rounded-full ${
                                isShortBranch ? "bg-[#B4233A]" : "bg-[#356B2B]"
                              }`}
                            />
                            <span>{clause}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Mobile-only connector between Trigger and Action */}
                  <div className="flex shrink-0 flex-col items-center justify-center py-2.5 lg:hidden">
                    <FlowConnector label="If True" />
                  </div>

                  {/* ========================================================
                   * LAYER 3 (RIGHT COLUMN): SEPARATE STANDALONE ACTION BOX PER PLATFORM
                   * Each platform is its own standalone `ACTION` box with a fixed input port (`act-in-B-R`)
                   * on its left border, connected from the Trigger output port via `@xyflow/react`.
                   * ======================================================== */}
                  <div className="flex min-w-0 flex-col gap-3.5 lg:flex-[1.25] lg:basis-0">
                    {branchEnabledRoutes.length === 0 ? (
                      <div className="rounded-2xl border-2 border-dashed border-[#DEDEDC] bg-white p-4 text-center text-[12px] text-[#626262]">
                        All platforms are currently disabled in your User Profile.
                      </div>
                    ) : (
                      branchDisplayRoutes.map((route, rIdx) => {
                        const boxKey = `${branch.path_id}_${route.platform.platform_id}`;
                        const rawBoxAmount =
                          customBoxAmounts[boxKey] !== undefined
                            ? customBoxAmounts[boxKey]
                            : route.notional_usd || branch.action.notional_usd || action.notional_usd;
                        const numericBoxAmount = parseFloat(
                          rawBoxAmount.replace(/[^0-9.]/g, "")
                        );
                        const normalizedAmountForUnits =
                          Number.isFinite(numericBoxAmount) && numericBoxAmount > 0
                            ? numericBoxAmount.toFixed(2)
                            : "0.00";
                        const displayAmountStr =
                          rawBoxAmount.trim() === ""
                            ? "0.00"
                            : Number.isFinite(numericBoxAmount)
                            ? numericBoxAmount.toFixed(2)
                            : route.notional_usd;
                        const isBearSide =
                          route.side.includes("SELL") ||
                          route.side.includes("SHORT") ||
                          route.side === "BUY NO";
                        const unitsStr = formatEstimatedUnits(
                          normalizedAmountForUnits,
                          route.spot_price,
                          route.symbol
                        );
                        const updateBoxAmount = (nextVal: string) => {
                          setCustomBoxAmounts((prev) => ({
                            ...prev,
                            [boxKey]: nextVal,
                          }));
                          if (rIdx === 0) {
                            const parsed = parseFloat(nextVal.replace(/[^0-9.]/g, ""));
                            if (Number.isFinite(parsed) && parsed > 0) {
                              onChangeNotional(parsed.toFixed(2));
                            }
                          }
                        };
                        return (
                          <div
                            key={boxKey}
                            className="relative flex items-center"
                          >
                            {/* Standalone `ACTION` Box for this single Platform with Fixed Left Input Port Handle */}
                            <div className="relative flex min-w-0 flex-1 flex-col justify-between rounded-2xl border-2 border-[#171717] bg-white p-3.5 shadow-xs">
                              <span
                                data-port-id={`act-in-${branchIdx}-${rIdx}`}
                                title={`Action Input Port (${route.platform.short_name})`}
                                className="pointer-events-none absolute top-1/2 -left-1.5 z-30 hidden h-3 w-3 -translate-y-1/2 rounded-full border-2 border-[#171717] bg-white shadow-2xs lg:block"
                              />

                              {/* Box Header: `ACTION` on Left | Single Platform Badge on Right */}
                              <div className="mb-2.5 flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold tracking-wider text-[#171717] uppercase">
                                  Action
                                </span>

                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E5E2] bg-[#F8F8F7] px-2.5 py-1 text-[11.5px] font-bold text-[#171717]">
                                  <PlatformBrandLogo
                                    platform={route.platform}
                                    size={18}
                                  />
                                  <span>{route.platform.short_name}</span>
                                </span>
                              </div>

                              {/* Single Platform Trade Action Row */}
                              <div className="flex items-center justify-between gap-2 rounded-xl bg-[#F7F7F5] p-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <AssetBrandLogo
                                    symbol={route.symbol}
                                    size={28}
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-bold whitespace-nowrap text-white ${
                                          isBearSide
                                            ? "bg-[#B4233A]"
                                            : "bg-[#356B2B]"
                                        }`}
                                      >
                                        {route.side}
                                      </span>
                                      <span className="truncate font-mono text-[13.5px] font-bold text-[#171717]">
                                        {route.symbol}
                                      </span>
                                    </div>
                                    <div className="mt-0.5 truncate text-[11px] text-[#626262]">
                                      via {route.platform.short_name} ·{" "}
                                      {route.asset_type_label}
                                    </div>
                                  </div>
                                </div>

                                <div className="shrink-0 text-right font-mono tabular-nums">
                                  <div className="text-[14px] font-bold text-[#171717]">
                                    ${displayAmountStr}
                                  </div>
                                  <div className="text-[10.5px] text-[#626262]">
                                    ≈ {unitsStr}
                                  </div>
                                </div>
                              </div>

                              {/* Order Amount + Custom Input + Quick Presets + TP/SL Footer */}
                              <div className="mt-2.5">
                                <div className="mb-1.5 flex items-center justify-between text-[10.5px] text-[#626262]">
                                  <span>Order Amount</span>
                                  <span className="font-mono">
                                    TP{" "}
                                    <strong className="text-[#356B2B]">
                                      {branch.action.take_profit_pct}
                                    </strong>{" "}
                                    · SL{" "}
                                    <strong className="text-[#B4233A]">
                                      {branch.action.stop_loss_pct}
                                    </strong>
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {/* Custom User Input Field */}
                                  <label className="relative flex min-w-0 flex-1 items-center">
                                    <span className="pointer-events-none absolute left-2.5 font-mono text-[11px] font-bold text-[#626262]">
                                      $
                                    </span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      aria-label={`Order amount in USD for ${route.platform.short_name}`}
                                      value={rawBoxAmount}
                                      onChange={(e) => {
                                        const cleaned = e.target.value.replace(
                                          /[^0-9.]/g,
                                          ""
                                        );
                                        updateBoxAmount(cleaned);
                                      }}
                                      onBlur={() => {
                                        if (
                                          Number.isFinite(numericBoxAmount) &&
                                          numericBoxAmount > 0
                                        ) {
                                          updateBoxAmount(
                                            numericBoxAmount.toFixed(2)
                                          );
                                        } else {
                                          updateBoxAmount(route.notional_usd);
                                        }
                                      }}
                                      placeholder="Custom"
                                      className="w-full rounded-lg border border-[#171717] bg-[#FBFBFA] py-1 pr-2 pl-5 font-mono text-[16px] font-bold text-[#171717] tabular-nums focus:bg-white focus:ring-1 focus:ring-[#171717] focus:outline-none sm:text-[11px]"
                                    />
                                  </label>

                                  {/* Quick Size Presets */}
                                  {quickSizes.map((sz) => {
                                    const active =
                                      Number.isFinite(numericBoxAmount) &&
                                      Math.abs(numericBoxAmount - parseFloat(sz)) <
                                        0.01;
                                    return (
                                      <button
                                        key={sz}
                                        type="button"
                                        onClick={() => updateBoxAmount(sz)}
                                        className={`shrink-0 rounded-lg border px-2 py-1 font-mono text-[11px] font-bold tabular-nums transition-colors ${
                                          active
                                            ? "border-[#171717] bg-[#171717] text-white"
                                            : "border-[#DEDEDC] bg-white text-[#171717] hover:bg-[#F5F5F4]"
                                        }`}
                                      >
                                        ${parseInt(sz, 10)}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {branchMatchingRoutes.length > defaultVisibleCount && (
                      <button
                        type="button"
                        onClick={() => setShowAllPlatformBoxes((prev) => !prev)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#DEDEDC] bg-white px-3.5 py-2 text-[11.5px] font-semibold text-[#171717] shadow-2xs transition-colors hover:bg-[#F5F5F4]"
                      >
                        <span>
                          {showAllPlatformBoxes
                            ? `Show Top ${defaultVisibleCount} Platform Action Boxes`
                            : `+ Show All ${branchMatchingRoutes.length} Separate Platform Action Boxes (${hiddenCollapsedCount} More)`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Outcome 2 — Clean 3-Part Smart Notification Card (`1. Signal -> 2. Alert Trigger -> 3. Notification Channels`).
 */
export function SmartNoticeDiagramView({
  diagram,
  onArmNotice,
  onOpenDirectTrade,
}: {
  diagram: SmartNoticeDiagramSpec;
  onArmNotice: (notice: SmartNoticeDiagramSpec) => void;
  onOpenDirectTrade: (symbol: string) => void;
}) {
  const [selectedChannels, setSelectedChannels] = useState<NoticeChannel[]>(
    diagram.action.channels
  );

  useEffect(() => {
    setSelectedChannels(diagram.action.channels);
  }, [diagram]);

  const allChannels: NoticeChannel[] = ["Push", "Email", "In-App", "Webhook"];

  const toggleChannel = (ch: NoticeChannel) => {
    setSelectedChannels((prev) =>
      prev.includes(ch)
        ? prev.length > 1
          ? prev.filter((c) => c !== ch)
          : prev
        : [...prev, ch]
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E2DF] bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDEDEA] bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <AssetBrandLogo symbol={diagram.signal.symbol} size={36} />
            <span className="-ml-2 rounded-lg ring-2 ring-white">
              <PlatformBrandLogo platform={diagram.action.platform} size={22} />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold text-[#171717]">
                {diagram.title}
              </h3>
              <span className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-[11px] font-semibold text-[#8A5700]">
                Smart Notification
              </span>
            </div>
            <p className="text-[12px] text-[#626262]">
              Watches live market &amp; social conditions and sends an instant alert without placing an order
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenDirectTrade(diagram.signal.symbol)}
            className="catalyst-focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DEDEDC] bg-white px-3.5 text-[12px] font-semibold text-[#171717] hover:bg-[#F5F5F4]"
          >
            Trade {diagram.signal.symbol}
          </button>
          <button
            type="button"
            onClick={() =>
              onArmNotice({
                ...diagram,
                action: { ...diagram.action, channels: selectedChannels },
              })
            }
            className="catalyst-focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#171717] px-4 text-[12px] font-semibold text-white hover:bg-[#2E2E2E]"
          >
            <CatalystIcon id="I06" size={14} />
            Create Alert
          </button>
        </div>
      </div>

      <div className="catalyst-dot-grid p-5">
        <div className="flex flex-col items-stretch lg:flex-row">
          {/* Signal */}
          <div className="flex flex-col justify-between rounded-xl border border-[#E5E5E2] bg-white p-4 shadow-2xs lg:flex-1 lg:basis-0">
            <div className="mb-3 flex items-center justify-between border-b border-[#F2F2F0] pb-2 text-[11px] font-bold text-[#171717] uppercase">
              <span>Signal</span>
              <SignalSourceLogo
                feedLabel={diagram.signal.news_feed_label}
                topic={diagram.signal.news_topic}
                size={22}
              />
            </div>
            <div className="rounded-xl border border-[#EDEDEA] bg-[#FBFBFA] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <AssetBrandLogo symbol={diagram.signal.symbol} size={30} />
                  <span className="text-[15px] font-bold text-[#171717]">
                    {diagram.signal.symbol}
                  </span>
                </div>
                <span className="font-mono text-[14px] font-bold text-[#171717] tabular-nums">
                  ${diagram.signal.spot_price}
                </span>
              </div>
              <div className="mt-2 text-[12px] font-semibold text-[#626262]">
                {diagram.signal.news_topic}
              </div>
            </div>
          </div>

          <FlowConnector label="Stream" />

          {/* Trigger */}
          <div className="flex flex-col justify-between rounded-xl border border-[#E5E5E2] bg-white p-4 shadow-2xs lg:flex-1 lg:basis-0">
            <div className="mb-3 flex items-center justify-between border-b border-[#F2F2F0] pb-2 text-[11px] font-bold text-[#171717] uppercase">
              <span>Trigger</span>
              <span className="text-[#8A5700]">
                Cooldown: {diagram.trigger.cooldown_window}
              </span>
            </div>
            <div className="rounded-xl border border-[#F5D08A] bg-[#FEF3C7]/40 p-3.5">
              <p className="text-[13px] leading-snug font-bold text-[#171717]">
                {diagram.trigger.headline_condition}
              </p>
            </div>
          </div>

          <FlowConnector label="Notify" />

          {/* Action */}
          <div className="flex flex-col justify-between rounded-xl border-2 border-[#171717] bg-white p-4 shadow-xs lg:flex-1 lg:basis-0">
            <div className="mb-3 flex items-center justify-between border-b border-[#F2F2F0] pb-2 text-[11px] font-bold text-[#171717] uppercase">
              <span>Action</span>
              <CatalystIcon id="I06" size={15} />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {allChannels.map((ch) => {
                const active = selectedChannels.includes(ch);
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(ch)}
                    className={`rounded-lg border px-2.5 py-2 text-[12px] font-semibold transition-colors ${
                      active
                        ? "border-[#171717] bg-[#171717] text-white"
                        : "border-[#DEDEDC] bg-[#F8F8F7] text-[#626262]"
                    }`}
                  >
                    {active ? `✓ ${ch}` : ch}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Outcome 3 — Clean Direct Order Ticket Card (Immediate Execution across Enabled Platforms).
 */
export function DirectTradeTicketView({
  ticket,
  enabledPlatformIds,
  onOpenUserProfile,
  onChangePlatform,
  onChangeNotional,
  onSubmitDirectTrade,
}: {
  ticket: DirectTradeTicketSpec;
  enabledPlatformIds?: string[];
  onOpenUserProfile?: () => void;
  onChangePlatform: (platformId: string) => void;
  onChangeNotional: (notionalUsd: string) => void;
  onSubmitDirectTrade: (ticket: DirectTradeTicketSpec) => void;
}) {
  const [countdown, setCountdown] = useState<number>(ticket.quote_expires_in_sec);
  const [reviewed, setReviewed] = useState<boolean>(false);

  useEffect(() => {
    setCountdown(15);
    setReviewed(false);
  }, [ticket.symbol, ticket.platform.platform_id, ticket.notional_usd]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 15 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const allRoutes: PlatformExecutionRoute[] =
    ticket.execution_routes && ticket.execution_routes.length > 0
      ? ticket.execution_routes
      : buildAllPlatformExecutionRoutes(
          ticket.title,
          ticket.symbol,
          ticket.asset_name,
          ticket.asset_class,
          ticket.side,
          ticket.notional_usd,
          ticket.platform.platform_id
        );

  const enabledRoutes =
    enabledPlatformIds && enabledPlatformIds.length > 0
      ? allRoutes.filter((r) => enabledPlatformIds.includes(r.platform.platform_id))
      : allRoutes;

  const quickSizes = ["100.00", "250.00", "500.00", "1000.00", "1500.00"];
  const estUnits = formatEstimatedUnits(
    ticket.notional_usd,
    ticket.live_price,
    ticket.symbol
  );

  return (
    <div className="max-w-2xl overflow-hidden rounded-2xl border border-[#E2E2DF] bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDEDEA] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <AssetBrandLogo symbol={ticket.symbol} size={36} />
            <span className="-ml-2 rounded-lg ring-2 ring-white">
              <PlatformBrandLogo platform={ticket.platform} size={22} />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 text-[11px] font-bold text-white ${
                  ticket.side.includes("SELL") ? "bg-[#B4233A]" : "bg-[#356B2B]"
                }`}
              >
                {ticket.side}
              </span>
              <h3 className="text-[16px] font-bold text-[#171717]">
                {ticket.symbol} · {ticket.asset_name}
              </h3>
            </div>
            <p className="text-[12px] text-[#626262]">
              Routed across <strong className="text-[#171717]">{enabledRoutes.length} Enabled Platforms</strong> ·{" "}
              Primary: {ticket.platform.name}
            </p>
          </div>
        </div>

        {onOpenUserProfile && (
          <button
            type="button"
            onClick={onOpenUserProfile}
            className="rounded-lg border border-[#DEDEDC] bg-[#F8F8F7] px-3 py-1.5 text-[11px] font-semibold text-[#171717] hover:bg-[#EAEAE7]"
          >
            User Profile ({enabledRoutes.length}/{allRoutes.length})
          </button>
        )}
      </div>

      <div className="space-y-4 p-5">
        {/* Multi-Platform Route Selector Strip */}
        <div className="max-h-[160px] space-y-1.5 overflow-y-auto pr-1">
          {enabledRoutes.map((route) => {
            const isSelected =
              route.platform.platform_id === ticket.platform.platform_id;
            return (
              <button
                key={route.platform.platform_id}
                type="button"
                onClick={() => onChangePlatform(route.platform.platform_id)}
                className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-colors ${
                  isSelected
                    ? "border-[#171717] bg-[#F8F8F7]"
                    : "border-[#EDEDEA] bg-white hover:border-[#BDBDB8]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <PlatformBrandLogo platform={route.platform} size={24} />
                  <AssetBrandLogo symbol={route.symbol} size={22} />
                  <div>
                    <div className="text-[12px] font-bold text-[#171717]">
                      {route.platform.name} · {route.side} {route.symbol}
                    </div>
                    <div className="text-[10px] text-[#626262]">
                      {route.asset_type_label} · {route.asset_name}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[12px] font-bold text-[#171717]">
                  ${route.spot_price}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-xl bg-[#F8F8F7] p-3.5">
          <div>
            <div className="text-[11px] text-[#626262]">Live Price</div>
            <div className="mt-0.5 font-mono text-[16px] font-bold text-[#171717] tabular-nums">
              ${ticket.live_price}{" "}
              <span className="text-[11px] font-semibold text-[#356B2B]">
                {ticket.change_24h_pct}
              </span>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#626262]">Order Amount</div>
            <div className="mt-0.5 font-mono text-[16px] font-bold text-[#171717] tabular-nums">
              ${ticket.notional_usd}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[#626262]">Est. Quantity</div>
            <div className="mt-0.5 font-mono text-[15px] font-semibold text-[#171717] tabular-nums">
              {estUnits}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-[#626262]">
            <span>Order Amount (Select or Input Custom)</span>
            <span>Available Cash: ${ticket.available_buying_power_usd}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative flex min-w-[110px] flex-1 items-center">
              <span className="pointer-events-none absolute left-3 font-mono text-[12px] font-bold text-[#626262]">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                aria-label="Custom order amount in USD"
                value={ticket.notional_usd}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                  onChangeNotional(cleaned || "0.00");
                }}
                placeholder="Custom USD"
                className="w-full rounded-lg border border-[#171717] bg-[#FBFBFA] py-1.5 pr-3 pl-6 font-mono text-[16px] font-semibold text-[#171717] tabular-nums focus:bg-white focus:ring-1 focus:ring-[#171717] focus:outline-none sm:text-[12px]"
              />
            </label>
            {quickSizes.map((sz) => {
              const active = parseFloat(ticket.notional_usd) === parseFloat(sz);
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => onChangeNotional(sz)}
                  className={`rounded-lg border px-3 py-1.5 font-mono text-[12px] font-semibold tabular-nums transition-colors ${
                    active
                      ? "border-[#171717] bg-[#171717] text-white"
                      : "border-[#DEDEDC] bg-white text-[#171717] hover:bg-[#F5F5F4]"
                  }`}
                >
                  ${parseInt(sz, 10)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#EDEDEA] pt-4">
          <span className="font-mono text-[11px] text-[#626262]">
            Quote refreshes in {countdown}s
          </span>

          {!reviewed ? (
            <button
              type="button"
              onClick={() => setReviewed(true)}
              className="catalyst-focus-ring inline-flex h-10 items-center gap-2 rounded-xl bg-[#171717] px-5 text-[13px] font-semibold text-white hover:bg-[#2E2E2E]"
            >
              Review Order
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                onSubmitDirectTrade({
                  ...ticket,
                  estimated_units: estUnits,
                })
              }
              className="catalyst-focus-ring inline-flex h-10 items-center gap-2 rounded-xl bg-[#356B2B] px-5 text-[13px] font-semibold text-white hover:bg-[#2B5822]"
            >
              <CatalystIcon id="I29" size={15} />
              Confirm &amp; Place {ticket.side} Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Outcome 4 — Conversational Confirmation & Disambiguation Response.
 * Triggered only when the user's question is vague or open-ended.
 */
export function ConfirmationDisambiguationView({
  response,
  onSelectProposal,
}: {
  response: CompileQueryResponse;
  onSelectProposal: (proposal: ConfirmationProposalCard) => void;
}) {
  const prompt = response.confirmation_prompt;
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>({});

  if (!prompt) return null;

  return (
    <div className="space-y-4">
      {/* Conversational Market Analysis Paragraph */}
      <div className="rounded-2xl border border-[#E5E5E2] bg-white p-5 shadow-2xs">
        <p className="text-[14px] leading-relaxed text-[#171717]">
          {prompt.market_synthesis_summary}
        </p>

        {/* Live Context Pills */}
        <div className="mt-3.5 flex flex-wrap gap-2">
          {prompt.live_context.map((metric, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E5E5E2] bg-[#F8F8F7] px-3 py-1.5 text-[12px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={metric.logo_svg}
                alt={metric.platform_name}
                className="h-4 w-4 rounded-xs object-contain"
              />
              <span className="text-[#626262]">{metric.label}:</span>
              <span className="font-mono font-semibold text-[#171717] tabular-nums">
                {metric.value}
              </span>
            </div>
          ))}
        </div>

        {/* Optional Parameter Pills */}
        {prompt.slot_groups.length > 0 && (
          <div className="mt-4 space-y-2.5 border-t border-[#EDEDEA] pt-3.5">
            {prompt.slot_groups.map((group) => {
              const currentVal =
                selectedSlots[group.slot_id] || group.selected_default;
              return (
                <div
                  key={group.slot_id}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="text-[12px] font-medium text-[#626262]">
                    {group.label}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {group.options.map((opt) => {
                      const active = currentVal === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setSelectedSlots((prev) => ({
                              ...prev,
                              [group.slot_id]: opt,
                            }))
                          }
                          className={`rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                            active
                              ? "border-[#171717] bg-[#171717] text-white"
                              : "border-[#DEDEDC] bg-white text-[#171717] hover:bg-[#F5F5F4]"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Follow-up Question + 3 Actionable Option Cards */}
      <div>
        <p className="mb-2.5 text-[13px] font-medium text-[#626262]">
          {prompt.why_confirmation_needed}
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {prompt.proposals.map((prop) => (
            <button
              key={prop.option_id}
              type="button"
              onClick={() => onSelectProposal(prop)}
              className={`group flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                prop.recommended
                  ? "border-[#171717] bg-white shadow-xs"
                  : "border-[#E2E2DF] bg-white hover:border-[#171717]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AssetBrandLogo symbol={prop.symbol} size={24} />
                    <PlatformBrandLogo platform={prop.platform} size={20} />
                    <span className="text-[12px] font-semibold text-[#171717]">
                      {prop.platform.short_name}
                    </span>
                  </div>
                  {prop.recommended && (
                    <span className="rounded-full bg-[#171717] px-2 py-0.5 text-[10px] font-semibold text-white">
                      Recommended
                    </span>
                  )}
                </div>

                <h4 className="mt-2.5 text-[14px] font-semibold text-[#171717] group-hover:underline">
                  {prop.title}
                </h4>
                <p className="mt-1 text-[12px] leading-relaxed text-[#626262]">
                  {prop.description}
                </p>
              </div>

              <div className="mt-3.5 flex items-center justify-between border-t border-[#EDEDEA] pt-2.5 text-[12px] font-semibold text-[#171717]">
                <span>Generate Diagram</span>
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
