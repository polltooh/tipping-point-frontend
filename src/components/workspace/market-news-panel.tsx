"use client";

import React, { useEffect, useState } from "react";
import { MarketNewsArticle, NewsCategory } from "@/lib/tipping-point-types";
import { getCuratedMarketNews } from "@/lib/tipping-point-compiler";
import {
  CatalystIcon,
  PlatformBrandLogo,
  SentimentBadge,
} from "@/components/design-system/tipping-point-icons";

const CATEGORY_TABS: { id: NewsCategory; label: string }[] = [
  { id: "global", label: "Global" },
  { id: "sports", label: "Sports" },
  { id: "pop_culture", label: "Pop culture" },
  { id: "bitcoin", label: "Bitcoin" },
  { id: "tech", label: "Tech & AI" },
];

const TICKER_FILTERS = ["ALL", "NVDA", "AMD", "BTC-USD", "GLD", "AAPL", "SPY"];

export function MarketNewsFeedPanel({
  onTriggerPrompt,
  compact = false,
}: {
  onTriggerPrompt: (prompt: string) => void;
  compact?: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>("global");
  const [selectedTicker, setSelectedTicker] = useState<string>("ALL");
  const [articles, setArticles] = useState<MarketNewsArticle[]>(() =>
    getCuratedMarketNews("global", "ALL")
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const params = new URLSearchParams({ category: activeCategory });
    if (selectedTicker !== "ALL") {
      params.set("ticker", selectedTicker);
    }
    fetch(`/api/news?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.articles?.length) {
          setArticles(data.articles);
        } else if (!cancelled) {
          setArticles(getCuratedMarketNews(activeCategory, selectedTicker));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setArticles(getCuratedMarketNews(activeCategory, selectedTicker));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeCategory, selectedTicker]);

  return (
    <section
      aria-label="Live Market News Feed"
      className="rounded-[14px] border border-[#DEDEDC] bg-[#F5F5F4] p-4"
    >
      {/* Outer Header Matching Reference Screenshot */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#E5E5E2] text-[#171717]">
              <CatalystIcon id="NEWS" size={15} />
            </span>
            <h2 className="text-[16px] font-bold text-[#171717]">News</h2>
          </div>
          <p className="mt-1 text-[13px] leading-snug text-[#626262]">
            Follow headlines and developments across markets and topics.
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#C5DFC0] bg-[#E8F1E6] px-2.5 py-1 text-[11px] font-semibold text-[#356B2B]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#356B2B]" />
          Live Feed
        </span>
      </div>

      {/* Inner White Rounded Feed Container */}
      <div className="rounded-[12px] border border-[#DEDEDC] bg-white p-3.5 shadow-2xs">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#626262]">
              <CatalystIcon id="NEWS" size={16} />
            </span>
            <span className="text-[14px] font-bold text-[#171717]">News Feed</span>
          </div>
          {isLoading && (
            <span className="text-[11px] font-medium text-[#626262]">Syncing...</span>
          )}
        </div>

        {/* Category Tabs with #171717 Active Bottom Indicator */}
        <div className="flex items-center gap-4 overflow-x-auto border-b border-[#DEDEDC]">
          {CATEGORY_TABS.map((tab) => {
            const active = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`relative shrink-0 pb-2.5 text-[13px] font-semibold transition-colors ${
                  active
                    ? "text-[#171717]"
                    : "text-[#626262] hover:text-[#171717]"
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute right-0 bottom-0 left-0 h-[2.5px] rounded-full bg-[#171717]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Ticker Filter Pills */}
        {!compact && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {TICKER_FILTERS.map((tkr) => {
              const active = selectedTicker === tkr;
              return (
                <button
                  key={tkr}
                  type="button"
                  onClick={() => setSelectedTicker(tkr)}
                  className={`rounded-[6px] px-2 py-0.5 font-mono text-[11px] font-semibold transition-colors ${
                    active
                      ? "bg-[#171717] text-white"
                      : "bg-[#F5F5F4] text-[#626262] hover:text-[#171717]"
                  }`}
                >
                  {tkr}
                </button>
              );
            })}
          </div>
        )}

        {/* Article Cards List */}
        <div className="mt-3 space-y-2.5">
          {articles.map((article) => (
            <article
              key={article.article_id}
              className="rounded-[10px] border border-[#EAEAE7] bg-[#F5F5F4]/75 p-3 transition-colors hover:border-[#DEDEDC] hover:bg-[#F5F5F4]"
            >
              {/* Top Row: Publisher Monogram Badge + Name + Date */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] text-[10px] font-extrabold tracking-tight"
                    style={{
                      backgroundColor: article.publisher_bg_hex,
                      color: article.publisher_fg_hex,
                    }}
                  >
                    {article.publisher_monogram}
                  </span>
                  <span className="truncate text-[12px] font-semibold text-[#626262]">
                    {article.publisher_name}
                  </span>
                </div>
                <span className="shrink-0 text-[11px] font-medium text-[#626262]">
                  {article.published_label}
                </span>
              </div>

              {/* Headline */}
              <h3 className="mt-1.5 line-clamp-2 text-[14px] leading-snug font-bold text-[#171717]">
                {article.title}
              </h3>

              {!compact && (
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#626262]">
                  {article.summary}
                </p>
              )}

              {/* Bottom Action Bar: Ticker + Human Sentiment + Auto-Platform Logo + 1-Click Actions */}
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#DEDEDC]/80 pt-2">
                <div className="flex items-center gap-1.5">
                  <PlatformBrandLogo platform={article.auto_platform} size={20} />
                  <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#171717]">
                    {article.primary_ticker}
                  </span>
                  <SentimentBadge sentiment={article.sentiment_label} />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onTriggerPrompt(article.workflow_prompt)}
                    className="catalyst-focus-ring inline-flex items-center gap-1 rounded-[6px] bg-[#171717] px-2 py-1 text-[11px] font-semibold text-white hover:bg-[#2E2E2E]"
                    title={`Build workflow: ${article.workflow_prompt}`}
                  >
                    <span>+ Workflow</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerPrompt(article.alert_prompt)}
                    className="catalyst-focus-ring inline-flex items-center gap-1 rounded-[6px] border border-[#DEDEDC] bg-white px-2 py-1 text-[11px] font-semibold text-[#171717] hover:bg-[#EAEAE7]"
                    title={`Set alert: ${article.alert_prompt}`}
                  >
                    <CatalystIcon id="I06" size={12} />
                    <span>Alert</span>
                  </button>
                  <a
                    href={article.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${article.publisher_name} source`}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] border border-[#DEDEDC] bg-white text-[#626262] hover:text-[#171717]"
                  >
                    <CatalystIcon id="I32" size={12} />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
