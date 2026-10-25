"use client";

import React from "react";
import { PlatformSpec, SentimentLabel } from "@/lib/tipping-point-types";

export type CatalystIconId =
  | "I01"
  | "I02"
  | "I03"
  | "I04"
  | "I05"
  | "I06"
  | "I07"
  | "I08"
  | "I09"
  | "I10"
  | "I11"
  | "I12"
  | "I13"
  | "I14"
  | "I15"
  | "I16"
  | "I18"
  | "I19"
  | "I21"
  | "I23"
  | "I24"
  | "I25"
  | "I27"
  | "I28"
  | "I29"
  | "I30"
  | "I31"
  | "I32"
  | "NEWS";

/**
 * Original 24x24 1.75px stroke SVG Icon Registry (I01-I32) from FRONTEND_DESIGN.md Section 4.
 */
export function CatalystIcon({
  id,
  size = 18,
  className = "",
}: {
  id: CatalystIconId;
  size?: number;
  className?: string;
}) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
  };

  switch (id) {
    case "I01": // Research chat
      return (
        <svg {...props}>
          <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-3.5 3v-3H7.5A2.5 2.5 0 0 1 5 12.5v-6Z" />
          <path d="M8.5 8.5h7M8.5 11.5h4.5" />
        </svg>
      );
    case "I02": // Market search
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      );
    case "I03": // Strategies (3 nodes linked by elbow connector)
      return (
        <svg {...props}>
          <rect x="3" y="4" width="5.5" height="5.5" rx="1.2" />
          <rect x="15.5" y="4" width="5.5" height="5.5" rx="1.2" />
          <rect x="15.5" y="14.5" width="5.5" height="5.5" rx="1.2" />
          <path d="M8.5 6.75h7M12 6.75v10.5h3.5" />
        </svg>
      );
    case "I04": // Portfolio donut
      return (
        <svg {...props}>
          <path d="M11 3.5a7.5 7.5 0 1 0 7.5 7.5H11V3.5Z" />
          <path d="M14.5 3.2A7.5 7.5 0 0 1 20.8 9.5h-6.3V3.2Z" />
        </svg>
      );
    case "I05": // Activity clock + list
      return (
        <svg {...props}>
          <circle cx="9.5" cy="12" r="6.5" />
          <path d="M9.5 8.5V12l2.5 1.5M18 8h3M18 12h3M18 16h2" />
        </svg>
      );
    case "I06": // Alert bell
      return (
        <svg {...props}>
          <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4.5 2 5.5 2 5.5h-15S6.5 14.5 6.5 10Z" />
          <path d="M10 18.5a2 2 0 0 0 4 0" />
        </svg>
      );
    case "I07": // Connection chain links
      return (
        <svg {...props}>
          <path d="M9.5 14.5 14.5 9.5" />
          <path d="m11 7 1.8-1.8a3.5 3.5 0 0 1 5 5L16 12" />
          <path d="m13 17-1.8 1.8a3.5 3.5 0 0 1-5-5L8 12" />
        </svg>
      );
    case "I08": // Settings sliders
      return (
        <svg {...props}>
          <path d="M4 8h9M17 8h3M4 16h3M11 16h9" />
          <circle cx="15" cy="8" r="2" />
          <circle cx="9" cy="16" r="2" />
        </svg>
      );
    case "I09": // Add
      return (
        <svg {...props}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "I10": // Send plane
      return (
        <svg {...props}>
          <path d="m21 3-9.5 18-2.8-7.7L1 10.5 21 3Z" />
          <path d="M21 3 8.7 13.3" />
        </svg>
      );
    case "I11": // Microphone
      return (
        <svg {...props}>
          <rect x="9" y="3.5" width="6" height="10" rx="3" />
          <path d="M6 11a6 6 0 0 0 12 0M12 17v3.5M9 20.5h6" />
        </svg>
      );
    case "I12": // Stop
      return (
        <svg {...props}>
          <rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" />
        </svg>
      );
    case "I13": // Play
      return (
        <svg {...props}>
          <polygon points="7 5 19 12 7 19 7 5" />
        </svg>
      );
    case "I14": // Pause
      return (
        <svg {...props}>
          <path d="M9 6v12M15 6v12" />
        </svg>
      );
    case "I15": // Retry
      return (
        <svg {...props}>
          <path d="M20 11A8 8 0 1 0 18 16.5" />
          <path d="M20 6v5h-5" />
        </svg>
      );
    case "I16": // Expand
      return (
        <svg {...props}>
          <path d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4" />
        </svg>
      );
    case "I18": // Close
      return (
        <svg {...props}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    case "I19": // Chevron
      return (
        <svg {...props}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case "I21": // Line chart
      return (
        <svg {...props}>
          <path d="M4 4v16h16" />
          <path d="m7 15 4-4 3 2.5 5-6" />
        </svg>
      );
    case "I23": // Allocation
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4v8l6 4" />
        </svg>
      );
    case "I24": // Order ticket
      return (
        <svg {...props}>
          <rect x="5" y="3.5" width="14" height="17" rx="2" />
          <path d="M8.5 8h7M8.5 12h7M8.5 16h4.5" />
        </svg>
      );
    case "I25": // Wallet
      return (
        <svg {...props}>
          <rect x="3.5" y="6" width="17" height="13" rx="2.2" />
          <path d="M16 12.5h4.5" />
          <circle cx="16" cy="12.5" r="1" fill="currentColor" />
        </svg>
      );
    case "I27": // Lock
      return (
        <svg {...props}>
          <rect x="5" y="10.5" width="14" height="10" rx="2" />
          <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case "I28": // Verified shield
      return (
        <svg {...props}>
          <path d="M12 3.5 5.5 6.2v5.3c0 4.5 2.8 7.8 6.5 9 3.7-1.2 6.5-4.5 6.5-9V6.2L12 3.5Z" />
          <path d="m9.2 12.2 2 2 3.8-4" />
        </svg>
      );
    case "I29": // Success check circle
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m8.5 12.2 2.3 2.3 4.8-4.8" />
        </svg>
      );
    case "I30": // Warning triangle
      return (
        <svg {...props}>
          <path d="M12 4 3.5 19h17L12 4Z" />
          <path d="M12 10v4M12 16.8h.01" />
        </svg>
      );
    case "I31": // Error circle
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m9 9 6 6M15 9l-6 6" />
        </svg>
      );
    case "I32": // External link
      return (
        <svg {...props}>
          <path d="M14 4h6v6M20 4l-8.5 8.5" />
          <path d="M11 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
        </svg>
      );
    case "NEWS":
    default:
      return (
        <svg {...props}>
          <path d="M6 4h9l4 4v12a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V5.5A1.5 1.5 0 0 1 6.5 4Z" />
          <path d="M14.5 4v4.5H19M8.5 11.5h7M8.5 15h7" />
        </svg>
      );
  }
}

/**
 * Renders the authentic SVG Brand Logo for any of the 16 trading platforms.
 */
export function PlatformBrandLogo({
  platform,
  size = 28,
  className = "",
}: {
  platform: PlatformSpec;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[#DEDEDC] bg-white shadow-2xs ${className}`}
      style={{ width: size, height: size }}
      title={`${platform.name} (${platform.venue_label})`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={platform.logo_svg}
        alt={`${platform.short_name} logo`}
        width={size}
        height={size}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

/**
 * Human-readable sentiment badge (never exposes raw API scores or "Polygon News Score").
 */
export function SentimentBadge({ sentiment }: { sentiment: SentimentLabel }) {
  const styleMap: Record<SentimentLabel, string> = {
    "Very Bullish": "bg-[#E8F1E6] text-[#26531E] border-[#B7D7B0]",
    Bullish: "bg-[#E8F1E6] text-[#356B2B] border-[#C5DFC0]",
    Bearish: "bg-[#FCE8EC] text-[#B4233A] border-[#F3B8C3]",
    "High-Impact Catalyst": "bg-[#FEF3C7] text-[#8A5700] border-[#F5D08A]",
    Neutral: "bg-[#F5F5F4] text-[#626262] border-[#DEDEDC]",
  };
  const prefixMap: Record<SentimentLabel, string> = {
    "Very Bullish": "▲ Very Bullish",
    Bullish: "↗ Bullish",
    Bearish: "↙ Bearish",
    "High-Impact Catalyst": "⚡ High Impact",
    Neutral: "• Neutral",
  };
  return (
    <span
      className={`inline-flex items-center rounded-[6px] border px-2 py-0.5 text-[11px] font-semibold tracking-tight ${styleMap[sentiment]}`}
    >
      {prefixMap[sentiment]}
    </span>
  );
}
