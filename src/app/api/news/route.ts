import { NextRequest, NextResponse } from "next/server";
import { getCuratedMarketNews } from "@/lib/tipping-point-compiler";
import { MarketNewsArticle, NewsCategory, SentimentLabel } from "@/lib/tipping-point-types";
import { autoSelectPlatform } from "@/lib/platform-registry";
import { loadSecrets } from "@/lib/secrets";

const BACKEND_URL = process.env.CATALYST_BACKEND_URL || "http://127.0.0.1:8000";

const PUBLISHER_STYLES: Record<string, [string, string, string]> = {
  "South China Morning Post": ["SC", "#1E293B", "#FACC15"],
  "Economic Times": ["ET", "#DC2626", "#FFFFFF"],
  "AP NEWS": ["AP", "#171717", "#FFFFFF"],
  "The Jerusalem Post": ["JP", "#B91C1C", "#FFFFFF"],
  Benzinga: ["BZ", "#1D4ED8", "#FFFFFF"],
  MarketWatch: ["MW", "#15803D", "#FFFFFF"],
  "The Motley Fool": ["MF", "#7C3AED", "#FFFFFF"],
  Reuters: ["RT", "#EA580C", "#FFFFFF"],
  Bloomberg: ["BB", "#111827", "#FFFFFF"],
  "Polymarket Live Odds": ["PM", "#1652F0", "#FFFFFF"],
  "Kalshi Prediction Market": ["KA", "#00D696", "#052E16"],
  "Polygon.io Market Wire": ["PG", "#4F46E5", "#FFFFFF"],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = (searchParams.get("category") || "global") as NewsCategory;
  const ticker = searchParams.get("ticker") || undefined;

  // 1. Try FastAPI backend first
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1400);
    const params = new URLSearchParams({ category });
    if (ticker) params.set("ticker", ticker);
    const upstream = await fetch(`${BACKEND_URL}/api/v1/news?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (upstream.ok) {
      const json = await upstream.json();
      return NextResponse.json(json);
    }
  } catch {
    // Continue to direct ingestion + curated market feed
  }

  const baseArticles = getCuratedMarketNews(category, ticker);
  const { polygonApiKey } = loadSecrets();

  if (polygonApiKey) {
    try {
      const tickerMap: Record<NewsCategory, string | undefined> = {
        global: undefined,
        sports: "DKNG",
        pop_culture: "NFLX",
        bitcoin: "COIN",
        tech: "NVDA",
      };
      const queryTicker = ticker && ticker !== "ALL" ? ticker : tickerMap[category];
      const url = new URL("https://api.polygon.io/v2/reference/news");
      url.searchParams.set("limit", "6");
      url.searchParams.set("order", "desc");
      url.searchParams.set("apiKey", polygonApiKey);
      if (queryTicker) url.searchParams.set("ticker", queryTicker);

      const res = await fetch(url.toString(), { next: { revalidate: 45 } });
      if (res.ok) {
        const data = await res.json();
        const liveItems: MarketNewsArticle[] = (data.results || [])
          .slice(0, 4)
          .map((raw: Record<string, unknown>, idx: number) => {
            const pubObj = (raw.publisher as Record<string, string>) || {};
            const pubName = pubObj.name || "Market Wire";
            const [mono, bgHex, fgHex] = PUBLISHER_STYLES[pubName] || [
              pubName.slice(0, 2).toUpperCase(),
              "#171717",
              "#FFFFFF",
            ];
            const tickers = (raw.tickers as string[]) || ["NVDA"];
            const primary = String(tickers[0] || "NVDA").toUpperCase();
            const titleStr = String(raw.title || "").trim();
            const lower = titleStr.toLowerCase();
            const sentiment: SentimentLabel = ["drop", "fall", "cut", "curb", "war"].some((w) =>
              lower.includes(w)
            )
              ? "High-Impact Catalyst"
              : "Bullish";
            const autoPlat = autoSelectPlatform(primary, "EQUITY", titleStr);
            return {
              article_id: String(raw.id || `live_${idx}`),
              category,
              publisher_name: pubName,
              publisher_monogram: mono,
              publisher_bg_hex: bgHex,
              publisher_fg_hex: fgHex,
              published_label: "Live",
              published_utc: String(raw.published_utc || new Date().toISOString()),
              title: titleStr,
              summary: String(raw.description || titleStr).slice(0, 180),
              primary_ticker: primary,
              asset_class: "EQUITY",
              sentiment_label: sentiment,
              source_url: String(raw.article_url || "https://www.marketwatch.com"),
              auto_platform: autoPlat,
              workflow_prompt: `Buy ${primary} when AI news is bullish`,
              alert_prompt: `Alert me whenever breaking semiconductor export news mentions ${primary}`,
            };
          });
        const merged = [
          ...baseArticles.slice(0, 2),
          ...liveItems,
          ...baseArticles.slice(2),
        ].slice(0, 10);
        return NextResponse.json({
          status: "Live Feed",
          category,
          count: merged.length,
          articles: merged,
        });
      }
    } catch {
      // Fallback to curated articles
    }
  }

  return NextResponse.json({
    status: "Live Feed",
    category,
    count: baseArticles.length,
    articles: baseArticles,
  });
}
